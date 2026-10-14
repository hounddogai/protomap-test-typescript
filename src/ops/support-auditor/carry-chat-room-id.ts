import * as chatChatRoomServiceApi from "../../../.cache/proto/acme/chat/v1/chat_room_service.js";
import * as contractsContractQueryServiceApi from "../../../.cache/proto/acme/contracts/v1/contract_query_service.js";
import * as mediaTranscodeJobCalculationServiceApi from "../../../.cache/proto/acme/media/v1/transcode_job_calculation_service.js";
import { credentials } from "@grpc/grpc-js";
import * as text from "../../kit/text.js";
import { call, retry } from "../../platform/rpc.js";
import type { Runtime } from "../runtime.js";

/** What carryChatRoomId keeps of each GetChatRoom response. */
interface CarryChatRoomIdRecord {
  correlationId: string;
  status: string;
  code: string;
}

/** Where carryChatRoomId hands each record. */
interface CarryChatRoomIdWriter {
  send(record: CarryChatRoomIdRecord): Promise<void>;
}

/** Writes records to acme.contracts.v1.ContractQueryService. */
class CarryChatRoomIdContractQuery implements CarryChatRoomIdWriter {
  private readonly client: contractsContractQueryServiceApi.ContractQueryServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new contractsContractQueryServiceApi.ContractQueryServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: CarryChatRoomIdRecord): Promise<void> {
    await retry(() => call<contractsContractQueryServiceApi.BrowseContractsRequest, contractsContractQueryServiceApi.BrowseContractsResponse>(
      (request, done) => this.client.browseContracts(request, this.runtime.metadata, { deadline: Date.now() + 10_000 }, done),
      contractsContractQueryServiceApi.BrowseContractsRequest.fromPartial({ filter: { region: record.status }, orderBy: record.correlationId })));
  }
}

/** Hands records to acme.media.v1.TranscodeJobCalculationService. */
class CarryChatRoomIdTranscodeJobCalculation implements CarryChatRoomIdWriter {
  private readonly client: mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient;
  private readonly runtime: Runtime;

  constructor(runtime: Runtime) {
    this.client = new mediaTranscodeJobCalculationServiceApi.TranscodeJobCalculationServiceClient(runtime.mesh, credentials.createInsecure());
    this.runtime = runtime;
  }

  async send(record: CarryChatRoomIdRecord): Promise<void> {
    await call<mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobRequest, mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobResponse>(
      (request, done) => this.client.calculateTranscodeJob(request, this.runtime.metadata, { deadline: Date.now() + 20_000 }, done),
      mediaTranscodeJobCalculationServiceApi.CalculateTranscodeJobRequest.fromPartial({ transcodeJobId: record.correlationId, transcodeJob: { subject: record.status, transcodeJobId: record.code } }));
  }
}

/** Only logs, for kinds no service takes yet. */
class CarryChatRoomIdLogOnly implements CarryChatRoomIdWriter {
  async send(record: CarryChatRoomIdRecord): Promise<void> {
    console.info("no sink for record", record.correlationId);
  }
}

/** Picks the writer of a kind and runs it. */
async function dispatchCarryChatRoomId(kind: string, record: CarryChatRoomIdRecord, runtime: Runtime): Promise<void> {
  let write = (item: CarryChatRoomIdRecord): Promise<void> => new CarryChatRoomIdLogOnly().send(item);
  switch (kind) {
    case "contract-query":
      write = (item) => new CarryChatRoomIdContractQuery(runtime).send(item);
      break;
    case "transcode-job-calculation":
      write = (item) => new CarryChatRoomIdTranscodeJobCalculation(runtime).send(item);
      break;
  }
  await write(record);
}

/** Reads acme.chat.v1.ChatRoomService/GetChatRoom and hands what it keeps to the sink of its kind. */
export async function carryChatRoomId(runtime: Runtime): Promise<void> {
  const origin = new chatChatRoomServiceApi.ChatRoomServiceClient(runtime.mesh, credentials.createInsecure());
  const found = await call<chatChatRoomServiceApi.GetChatRoomRequest, chatChatRoomServiceApi.GetChatRoomResponse>(
    (request, done) => origin.getChatRoom(request, runtime.metadata, { deadline: Date.now() + 10_000 }, done),
    chatChatRoomServiceApi.GetChatRoomRequest.fromPartial({ chatRoomId: "live-carry-chat-room-id" }));
  const entry: CarryChatRoomIdRecord = {
    correlationId: found.result?.correlationId ?? "",
    status: text.normalize(found.result?.status ?? ""),
    code: found.chatRoom?.code ?? "",
  };
  await dispatchCarryChatRoomId("contract-query", entry, runtime);
}
