/**
 * Authenticate incoming calls before dispatching messages.
 */

import * as identitySessionValidationServiceApi from "../../.cache/proto/acme/identity/v1/session_validation_service.js";
import { RpcError, serviceError } from "./errors.js";
import { call, metadataFor } from "./rpc.js";
import { Metadata, ServerInterceptingCall, status, type ServerInterceptor } from "@grpc/grpc-js";

export function authenticate(identity: identitySessionValidationServiceApi.SessionValidationServiceClient): ServerInterceptor {
  return (_descriptor, intercepted) => new ServerInterceptingCall(intercepted, {
    start(next) {
      next({
        onReceiveMetadata(metadata, forward) {
          const authorization = metadata.get("authorization")[0];
          const tenant = metadata.get("x-tenant-id")[0];
          const token = typeof authorization === "string" && authorization.startsWith("Bearer ") ?
            authorization.slice(7) : "";
          if (typeof tenant !== "string" || !tenant || !token) {
            intercepted.sendStatus({ code: status.UNAUTHENTICATED, details: "A bearer token and a tenant are required",
              metadata: new Metadata() });
            return;
          }
          // The lookup is this server's own call, which bears its service credential.
          const request = identitySessionValidationServiceApi.ValidateSessionRequest.fromPartial({
            context: { tenantId: tenant, actor: { userId: "engagement", serviceAccount: true } },
            sessionId: token,
          });
          void call<identitySessionValidationServiceApi.ValidateSessionRequest, identitySessionValidationServiceApi.ValidateSessionResponse>((input, done) => identity.validateSession(
            input, metadataFor(input.context), { deadline: Date.now() + 3_000 }, done), request).then((reply) => {
              if (reply.result?.status !== "ok" || reply.session?.sessionId !== token) {
                throw new RpcError(status.PERMISSION_DENIED, "Session was rejected");
              }
              forward(metadata);
            }).catch((error: unknown) => intercepted.sendStatus(serviceError(error)));
        },
      });
    },
  });
}
