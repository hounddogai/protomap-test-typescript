import "reflect-metadata";
/**
 * Operator lookups and an escape hatch for incident response.
 */

import * as audiencesAudienceApprovalServiceApi from "../../.cache/proto/acme/audiences/v1/audience_approval_service.js";
import * as audiencesAudienceMemberApprovalServiceApi from "../../.cache/proto/acme/audiences/v1/audience_member_approval_service.js";
import * as audiencesAudienceMemberCalculationServiceApi from "../../.cache/proto/acme/audiences/v1/audience_member_calculation_service.js";
import * as audiencesAudienceMemberQueryServiceApi from "../../.cache/proto/acme/audiences/v1/audience_member_query_service.js";
import * as audiencesAudienceMemberValidationServiceApi from "../../.cache/proto/acme/audiences/v1/audience_member_validation_service.js";
import * as audiencesAudienceMemberWorkflowServiceApi from "../../.cache/proto/acme/audiences/v1/audience_member_workflow_service.js";
import * as audiencesAudienceQueryServiceApi from "../../.cache/proto/acme/audiences/v1/audience_query_service.js";
import { configuration } from "../platform/config.js";
import { createApplication } from "../platform/container.js";
import { RpcError } from "../platform/errors.js";
import { ClientRegistry } from "../platform/registry.js";
import { call } from "../platform/rpc.js";
import { Client, Metadata, credentials, status } from "@grpc/grpc-js";

const config = configuration();
const app = createApplication(config);
const clients = app.scope.resolve<ClientRegistry>("clients");
const metadata = new Metadata();
metadata.set("authorization", `Bearer ${config.serviceToken}`);
metadata.set("x-tenant-id", config.tenant);
// The program acts with the server's credential, as its service account, which the servers downstream require.
const actor = { userId: "engagementctl", serviceAccount: true };
try {
  switch (process.argv[2]) {
    case "get-audience-approval-status": {
      const client = clients.get<audiencesAudienceApprovalServiceApi.AudienceApprovalServiceClient>("acme.audiences.v1.AudienceApprovalService");
      const reply = await call<audiencesAudienceApprovalServiceApi.GetAudienceApprovalStatusRequest, audiencesAudienceApprovalServiceApi.GetAudienceApprovalStatusResponse>((input, done) =>
        client.getAudienceApprovalStatus(input, metadata, { deadline: Date.now() + 15_000 }, done),
        audiencesAudienceApprovalServiceApi.GetAudienceApprovalStatusRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          audienceId: process.argv[3] ?? "" }));
      process.stdout.write(JSON.stringify(audiencesAudienceApprovalServiceApi.GetAudienceApprovalStatusResponse.toJSON(reply)) + "\n");
      break;
    }
    case "get-audience-member-approval-status": {
      const client = clients.get<audiencesAudienceMemberApprovalServiceApi.AudienceMemberApprovalServiceClient>("acme.audiences.v1.AudienceMemberApprovalService");
      const reply = await call<audiencesAudienceMemberApprovalServiceApi.GetAudienceMemberApprovalStatusRequest, audiencesAudienceMemberApprovalServiceApi.GetAudienceMemberApprovalStatusResponse>((input, done) =>
        client.getAudienceMemberApprovalStatus(input, metadata, { deadline: Date.now() + 15_000 }, done),
        audiencesAudienceMemberApprovalServiceApi.GetAudienceMemberApprovalStatusRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          audienceMemberId: process.argv[3] ?? "" }));
      process.stdout.write(JSON.stringify(audiencesAudienceMemberApprovalServiceApi.GetAudienceMemberApprovalStatusResponse.toJSON(reply)) + "\n");
      break;
    }
    case "get-audience-member-rates": {
      const client = clients.get<audiencesAudienceMemberCalculationServiceApi.AudienceMemberCalculationServiceClient>("acme.audiences.v1.AudienceMemberCalculationService");
      const reply = await call<audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesRequest, audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesResponse>((input, done) =>
        client.getAudienceMemberRates(input, metadata, { deadline: Date.now() + 15_000 }, done),
        audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          audienceMemberId: process.argv[3] ?? "" }));
      process.stdout.write(JSON.stringify(audiencesAudienceMemberCalculationServiceApi.GetAudienceMemberRatesResponse.toJSON(reply)) + "\n");
      break;
    }
    case "lookup-audience-member": {
      const client = clients.get<audiencesAudienceMemberQueryServiceApi.AudienceMemberQueryServiceClient>("acme.audiences.v1.AudienceMemberQueryService");
      const reply = await call<audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberRequest, audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberResponse>((input, done) =>
        client.lookupAudienceMember(input, metadata, { deadline: Date.now() + 15_000 }, done),
        audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          audienceMemberId: process.argv[3] ?? "" }));
      process.stdout.write(JSON.stringify(audiencesAudienceMemberQueryServiceApi.LookupAudienceMemberResponse.toJSON(reply)) + "\n");
      break;
    }
    case "peek-audience-member": {
      const client = clients.get<audiencesAudienceMemberQueryServiceApi.AudienceMemberQueryServiceClient>("acme.audiences.v1.AudienceMemberQueryService");
      const reply = await call<audiencesAudienceMemberQueryServiceApi.PeekAudienceMemberRequest, audiencesAudienceMemberQueryServiceApi.PeekAudienceMemberResponse>((input, done) =>
        client.peekAudienceMember(input, metadata, { deadline: Date.now() + 15_000 }, done),
        audiencesAudienceMemberQueryServiceApi.PeekAudienceMemberRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          audienceMemberId: process.argv[3] ?? "" }));
      process.stdout.write(JSON.stringify(audiencesAudienceMemberQueryServiceApi.PeekAudienceMemberResponse.toJSON(reply)) + "\n");
      break;
    }
    case "get-audience-member-rules": {
      const client = clients.get<audiencesAudienceMemberValidationServiceApi.AudienceMemberValidationServiceClient>("acme.audiences.v1.AudienceMemberValidationService");
      const reply = await call<audiencesAudienceMemberValidationServiceApi.GetAudienceMemberRulesRequest, audiencesAudienceMemberValidationServiceApi.GetAudienceMemberRulesResponse>((input, done) =>
        client.getAudienceMemberRules(input, metadata, { deadline: Date.now() + 15_000 }, done),
        audiencesAudienceMemberValidationServiceApi.GetAudienceMemberRulesRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          audienceMemberId: process.argv[3] ?? "" }));
      process.stdout.write(JSON.stringify(audiencesAudienceMemberValidationServiceApi.GetAudienceMemberRulesResponse.toJSON(reply)) + "\n");
      break;
    }
    case "inspect-audience-member-workflow": {
      const client = clients.get<audiencesAudienceMemberWorkflowServiceApi.AudienceMemberWorkflowServiceClient>("acme.audiences.v1.AudienceMemberWorkflowService");
      const reply = await call<audiencesAudienceMemberWorkflowServiceApi.InspectAudienceMemberWorkflowRequest, audiencesAudienceMemberWorkflowServiceApi.InspectAudienceMemberWorkflowResponse>((input, done) =>
        client.inspectAudienceMemberWorkflow(input, metadata, { deadline: Date.now() + 15_000 }, done),
        audiencesAudienceMemberWorkflowServiceApi.InspectAudienceMemberWorkflowRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          audienceMemberId: process.argv[3] ?? "" }));
      process.stdout.write(JSON.stringify(audiencesAudienceMemberWorkflowServiceApi.InspectAudienceMemberWorkflowResponse.toJSON(reply)) + "\n");
      break;
    }
    case "lookup-audience": {
      const client = clients.get<audiencesAudienceQueryServiceApi.AudienceQueryServiceClient>("acme.audiences.v1.AudienceQueryService");
      const reply = await call<audiencesAudienceQueryServiceApi.LookupAudienceRequest, audiencesAudienceQueryServiceApi.LookupAudienceResponse>((input, done) =>
        client.lookupAudience(input, metadata, { deadline: Date.now() + 15_000 }, done),
        audiencesAudienceQueryServiceApi.LookupAudienceRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          audienceId: process.argv[3] ?? "" }));
      process.stdout.write(JSON.stringify(audiencesAudienceQueryServiceApi.LookupAudienceResponse.toJSON(reply)) + "\n");
      break;
    }
    case "raw": {
      const path = process.argv[3];
      if (!path?.startsWith("/")) throw new RpcError(status.INVALID_ARGUMENT, "Expected an RPC path");
      const payload = Buffer.from(process.argv[4] ?? "", "base64");
      const client = new Client(config.mesh, credentials.createInsecure());
      try {
        const reply = await new Promise<Buffer>((resolve, reject) => {
          client.makeUnaryRequest(path, (value: Buffer) => value, (value: Buffer) => value,
            payload, metadata, { deadline: Date.now() + 15_000 }, (error, value) => {
              if (error) reject(error); else resolve(value ?? Buffer.alloc(0));
            });
        });
        process.stdout.write(reply.toString("base64") + "\n");
      } finally { client.close(); }
      break;
    }
    default: throw new RpcError(status.INVALID_ARGUMENT, "Choose a lookup command or raw RPC path");
  }
} finally { await app.close(); }
