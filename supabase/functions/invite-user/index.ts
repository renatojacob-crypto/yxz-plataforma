import {
  withSupabase,
} from "npm:@supabase/server@^1";


/*
 * Perfis que podem ser criados pela
 * Central de Usuários.
 *
 * Administrador Master não é permitido
 * por esta operação.
 *
 * Instrutores também não recebem login
 * por enquanto.
 */
const ALLOWED_PROFILES =
  new Set([
    "administrador",
    "educador_social",
    "coordenador",
  ]);


/* =========================================================
   UTILIDADES
========================================================= */

function normalizeText(
  value: unknown,
  maxLength = 120,
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }


  return value
    .trim()
    .slice(
      0,
      maxLength,
    );
}


function normalizeEmail(
  value: unknown,
) {
  return normalizeText(
    value,
    254,
  ).toLowerCase();
}


function isValidEmail(
  email: string,
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(
      email,
    );
}


function jsonError(
  message: string,
  status: number,
  code: string,
) {
  return Response.json(
    {
      ok: false,
      code,
      message,
    },
    {
      status,
    },
  );
}


/* =========================================================
   EDGE FUNCTION
========================================================= */

export default {
  fetch:
    withSupabase(
      {
        auth: "user",
      },

      async (
        req,
        ctx,
      ) => {

        /* =================================================
           MÉTODO
        ================================================= */

        if (
          req.method !==
          "POST"
        ) {
          return jsonError(
            "Método não permitido.",
            405,
            "method_not_allowed",
          );
        }


        /* =================================================
           AUTORIZAÇÃO
        ================================================= */

        const {
          data:
            canManageUsers,

          error:
            permissionError,
        } =
          await ctx.supabase
            .rpc(
              "can_manage_users",
            );


        if (
          permissionError
        ) {
          console.error(
            "[YXZ] Falha ao verificar permissão:",
            permissionError,
          );


          return jsonError(
            "Não foi possível verificar sua permissão.",
            500,
            "permission_check_failed",
          );
        }


        if (
          canManageUsers !==
          true
        ) {
          return jsonError(
            "Você não possui permissão para criar usuários.",
            403,
            "forbidden",
          );
        }


        /* =================================================
           PAYLOAD
        ================================================= */

        let body:
          Record<
            string,
            unknown
          >;


        try {
          body =
            await req.json();
        } catch {
          return jsonError(
            "Dados inválidos.",
            400,
            "invalid_json",
          );
        }


        const nome =
          normalizeText(
            body.nome,
          );


        const email =
          normalizeEmail(
            body.email,
          );


        const cargo =
          normalizeText(
            body.cargo,
          );


        const perfil =
          normalizeText(
            body.perfil,
            40,
          );


        /* =================================================
           VALIDAÇÕES
        ================================================= */

        if (!nome) {
          return jsonError(
            "Informe o nome do usuário.",
            400,
            "name_required",
          );
        }


        if (
          !email ||
          !isValidEmail(
            email,
          )
        ) {
          return jsonError(
            "Informe um e-mail válido.",
            400,
            "invalid_email",
          );
        }


        if (!cargo) {
          return jsonError(
            "Informe o cargo do usuário.",
            400,
            "role_required",
          );
        }


        if (
          !ALLOWED_PROFILES
            .has(
              perfil,
            )
        ) {
          return jsonError(
            "Este perfil não pode ser criado pela Central de Usuários.",
            400,
            "invalid_profile",
          );
        }


        /* =================================================
           URL DO CONVITE
        ================================================= */

        const redirectTo =
          Deno.env.get(
            "YXZ_INVITE_REDIRECT_URL",
          );


        if (!redirectTo) {
          console.error(
            "[YXZ] YXZ_INVITE_REDIRECT_URL não configurada.",
          );


          return jsonError(
            "O endereço de ativação da conta não está configurado.",
            500,
            "invite_redirect_missing",
          );
        }


        /* =================================================
           CONVITE
        ================================================= */

        const {
          data:
            inviteData,

          error:
            inviteError,
        } =
          await ctx
            .supabaseAdmin
            .auth
            .admin
            .inviteUserByEmail(
              email,
              {
                data: {
                  name:
                    nome,

                  full_name:
                    nome,

                  yxz_invite_pending:
                    true,
                },

                redirectTo,
              },
            );


        if (
          inviteError
        ) {
          console.error(
            "[YXZ] Falha ao enviar convite:",
            {
              code:
                inviteError.code,

              status:
                inviteError.status,

              message:
                inviteError.message,
            },
          );


          const message =
            (
              inviteError
                .message ||
              ""
            )
              .toLowerCase();


          if (
            message.includes(
              "already",
            ) ||
            message.includes(
              "registered",
            ) ||
            message.includes(
              "exists",
            )
          ) {
            return jsonError(
              "Já existe uma conta cadastrada com esse e-mail.",
              409,
              "user_already_exists",
            );
          }


          return jsonError(
            "Não foi possível enviar o convite.",
            400,
            "invite_failed",
          );
        }


        const invitedUser =
          inviteData?.user;


        if (
          !invitedUser?.id
        ) {
          return jsonError(
            "O usuário foi convidado, mas não foi possível identificar a nova conta.",
            500,
            "invited_user_missing",
          );
        }


        /* =================================================
           CONFIGURAR PROFILE
        ================================================= */

        const {
          data:
            updatedProfile,

          error:
            profileError,
        } =
          await ctx
            .supabaseAdmin
            .from(
              "profiles",
            )
            .update({
              nome,
              cargo,
              perfil,
              ativo:
                true,
            })
            .eq(
              "id",
              invitedUser.id,
            )
            .select(`
              id,
              nome,
              email,
              cargo,
              perfil,
              ativo,
              pode_gerenciar_usuarios
            `)
            .maybeSingle();


        /*
         * Se essa etapa falhar, o usuário
         * continuará com:
         *
         * ativo = false
         *
         * graças ao trigger de segurança.
         */
        if (
          profileError ||
          !updatedProfile
        ) {
          console.error(
            "[YXZ] Convite enviado, mas profile não pôde ser configurado:",
            profileError,
          );


          return Response.json(
            {
              ok: true,

              warning: true,

              message:
                "Convite enviado, mas o usuário permaneceu inativo. Revise o perfil na Central de Usuários.",

              userId:
                invitedUser.id,
            },
            {
              status: 201,
            },
          );
        }


        /* =================================================
           SUCESSO
        ================================================= */

        return Response.json(
          {
            ok: true,

            warning: false,

            message:
              "Convite enviado com sucesso.",

            user: {
              id:
                updatedProfile.id,

              nome:
                updatedProfile.nome,

              email:
                updatedProfile.email,

              cargo:
                updatedProfile.cargo,

              perfil:
                updatedProfile.perfil,

              ativo:
                updatedProfile.ativo,
            },
          },
          {
            status: 201,
          },
        );
      },
    ),
};