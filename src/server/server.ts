/**
 * Compose all engagement domains on one authenticated gRPC server.
 */

import * as identitySessionValidationServiceApi from "../../.cache/proto/acme/identity/v1/session_validation_service.js";
import { register as registerAudiences, startWorkers as startAudiencesWorkers } from "../domains/audiences/module.js";
import { register as registerCampaigns, startWorkers as startCampaignsWorkers } from "../domains/campaigns/module.js";
import { register as registerChat, startWorkers as startChatWorkers } from "../domains/chat/module.js";
import { register as registerCommunity, startWorkers as startCommunityWorkers } from "../domains/community/module.js";
import { register as registerContent, startWorkers as startContentWorkers } from "../domains/content/module.js";
import {
  register as registerExperiments,
  startWorkers as startExperimentsWorkers,
} from "../domains/experiments/module.js";
import { register as registerForms, startWorkers as startFormsWorkers } from "../domains/forms/module.js";
import {
  register as registerLocalization,
  startWorkers as startLocalizationWorkers,
} from "../domains/localization/module.js";
import { register as registerMedia, startWorkers as startMediaWorkers } from "../domains/media/module.js";
import { register as registerMessaging, startWorkers as startMessagingWorkers } from "../domains/messaging/module.js";
import {
  register as registerNotifications,
  startWorkers as startNotificationsWorkers,
} from "../domains/notifications/module.js";
import {
  register as registerPersonalization,
  startWorkers as startPersonalizationWorkers,
} from "../domains/personalization/module.js";
import { register as registerSurveys, startWorkers as startSurveysWorkers } from "../domains/surveys/module.js";
import { register as registerWebbff, startWorkers as startWebbffWorkers } from "../domains/webbff/module.js";
import { register as registerWebhooks, startWorkers as startWebhooksWorkers } from "../domains/webhooks/module.js";
import { authenticate } from "../platform/authentication.js";
import { Server } from "@grpc/grpc-js";
import { type DependencyContainer } from "tsyringe";

export function createServer(scope: DependencyContainer): Server {
  const identity = scope.resolve<identitySessionValidationServiceApi.SessionValidationServiceClient>("grpc:acme.identity.v1.SessionValidationService");
  const server = new Server({ interceptors: [authenticate(identity)], "grpc.max_receive_message_length":
    8 * 1024 * 1024 });
  registerAudiences(server, scope);
  startAudiencesWorkers(scope);
  registerCampaigns(server, scope);
  startCampaignsWorkers(scope);
  registerChat(server, scope);
  startChatWorkers(scope);
  registerCommunity(server, scope);
  startCommunityWorkers(scope);
  registerContent(server, scope);
  startContentWorkers(scope);
  registerExperiments(server, scope);
  startExperimentsWorkers(scope);
  registerForms(server, scope);
  startFormsWorkers(scope);
  registerLocalization(server, scope);
  startLocalizationWorkers(scope);
  registerMedia(server, scope);
  startMediaWorkers(scope);
  registerMessaging(server, scope);
  startMessagingWorkers(scope);
  registerNotifications(server, scope);
  startNotificationsWorkers(scope);
  registerPersonalization(server, scope);
  startPersonalizationWorkers(scope);
  registerSurveys(server, scope);
  startSurveysWorkers(scope);
  registerWebbff(server, scope);
  startWebbffWorkers(scope);
  registerWebhooks(server, scope);
  startWebhooksWorkers(scope);
  return server;
}
