/**
 * Answers read-only questions about experiments, for screens and reports.
 */

import * as experimentsExperimentQueryServiceApi from "../../../../../.cache/proto/acme/experiments/v1/experiment_query_service.js";
import { serviceError } from "../../../../platform/errors.js";
import { serverStream, unary } from "../../../../platform/handlers.js";
import { ExperimentQueryWorkflow } from "./experiment-query.workflow.js";
import { type ServerUnaryCall, type sendUnaryData } from "@grpc/grpc-js";
import { inject, injectable } from "tsyringe";

/**
 * The gRPC boundary for ExperimentQueryService; workflows own validation and database transactions.
 */
@injectable()
export class ExperimentQueryHandler {
  constructor(@inject(ExperimentQueryWorkflow) private readonly workflow: ExperimentQueryWorkflow) {}

  /**
   * Lists experiments a page at a time.
   */
  browseExperiments = unary<experimentsExperimentQueryServiceApi.BrowseExperimentsRequest, experimentsExperimentQueryServiceApi.BrowseExperimentsResponse>(
    (request) => this.workflow.browseExperiments(request),
  );

  /**
   * Counts experiments by status.
   */
  countExperiments = (call: ServerUnaryCall<experimentsExperimentQueryServiceApi.CountExperimentsRequest, experimentsExperimentQueryServiceApi.CountExperimentsResponse>, done: sendUnaryData<experimentsExperimentQueryServiceApi.CountExperimentsResponse>): void => {
    void this.workflow.countExperiments(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Streams every matching experiment.
   */
  exportExperiments = serverStream<experimentsExperimentQueryServiceApi.ExportExperimentsRequest, experimentsExperimentQueryServiceApi.ExportExperimentsResponse>(
    (request) => this.workflow.exportExperiments(request),
  );

  /**
   * Lists experiments a page at a time.
   */
  findExperiments = unary<experimentsExperimentQueryServiceApi.FindExperimentsRequest, experimentsExperimentQueryServiceApi.FindExperimentsResponse>(
    (request) => this.workflow.findExperiments(request),
  );

  /**
   * Returns an experiment.
   */
  lookupExperiment = (call: ServerUnaryCall<experimentsExperimentQueryServiceApi.LookupExperimentRequest, experimentsExperimentQueryServiceApi.LookupExperimentResponse>, done: sendUnaryData<experimentsExperimentQueryServiceApi.LookupExperimentResponse>): void => {
    void this.workflow.lookupExperiment(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Returns an experiment.
   */
  peekExperiment = unary<experimentsExperimentQueryServiceApi.PeekExperimentRequest, experimentsExperimentQueryServiceApi.PeekExperimentResponse>(
    (request) => this.workflow.peekExperiment(request),
  );

  /**
   * Returns several experiments at once.
   */
  resolveExperiments = unary<experimentsExperimentQueryServiceApi.ResolveExperimentsRequest, experimentsExperimentQueryServiceApi.ResolveExperimentsResponse>(
    (request) => this.workflow.resolveExperiments(request),
  );

  /**
   * Lists experiments a page at a time.
   */
  suggestExperiments = (call: ServerUnaryCall<experimentsExperimentQueryServiceApi.SuggestExperimentsRequest, experimentsExperimentQueryServiceApi.SuggestExperimentsResponse>, done: sendUnaryData<experimentsExperimentQueryServiceApi.SuggestExperimentsResponse>): void => {
    void this.workflow.suggestExperiments(call.request).then(
      (reply) => done(null, reply), (error: unknown) => done(serviceError(error)),
    );
  };

  /**
   * Summarizes an experiment.
   */
  summarizeExperiments = unary<experimentsExperimentQueryServiceApi.SummarizeExperimentsRequest, experimentsExperimentQueryServiceApi.SummarizeExperimentsResponse>(
    (request) => this.workflow.summarizeExperiments(request),
  );
}

export function implementation(handler: ExperimentQueryHandler): experimentsExperimentQueryServiceApi.ExperimentQueryServiceServer {
  return {
    browseExperiments: handler.browseExperiments,
    countExperiments: handler.countExperiments,
    exportExperiments: handler.exportExperiments,
    findExperiments: handler.findExperiments,
    lookupExperiment: handler.lookupExperiment,
    peekExperiment: handler.peekExperiment,
    resolveExperiments: handler.resolveExperiments,
    suggestExperiments: handler.suggestExperiments,
    summarizeExperiments: handler.summarizeExperiments,
  };
}
