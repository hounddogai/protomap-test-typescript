import "reflect-metadata";
/**
 * The replay job refreshes downstream views from paged records.
 */

import * as contentArticleServiceApi from "../../.cache/proto/acme/content/v1/article_service.js";
import * as experimentsExperimentServiceApi from "../../.cache/proto/acme/experiments/v1/experiment_service.js";
import * as formsFormServiceApi from "../../.cache/proto/acme/forms/v1/form_service.js";
import * as localizationTranslationKeyServiceApi from "../../.cache/proto/acme/localization/v1/translation_key_service.js";
import * as mediaMediaAssetServiceApi from "../../.cache/proto/acme/media/v1/media_asset_service.js";
import { configuration } from "../platform/config.js";
import { createApplication } from "../platform/container.js";
import { ClientRegistry } from "../platform/registry.js";
import { call } from "../platform/rpc.js";
import { Metadata } from "@grpc/grpc-js";

const config = configuration();
const app = createApplication(config);
const clients = app.scope.resolve<ClientRegistry>("clients");
const metadata = new Metadata();
metadata.set("authorization", `Bearer ${config.serviceToken}`);
metadata.set("x-tenant-id", config.tenant);
// The program acts with the server's credential, as its service account, which the servers downstream require.
const actor = { userId: "engagement-replay", serviceAccount: true };
try {
  const client0 = clients.get<contentArticleServiceApi.ArticleServiceClient>("acme.content.v1.ArticleService");
  let pageToken0 = "";
  do {
    const page = await call<contentArticleServiceApi.ListArticlesRequest, contentArticleServiceApi.ListArticlesResponse>((request, done) =>
      client0.listArticles(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      contentArticleServiceApi.ListArticlesRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken0 } }));
    await Promise.all(page.articles.map(async (record) => {
      await call<contentArticleServiceApi.GetArticleRequest, contentArticleServiceApi.GetArticleResponse>((request, done) =>
        client0.getArticle(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        contentArticleServiceApi.GetArticleRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          articleId: record.articleId }));
    }));
    pageToken0 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken0);
  const client1 = clients.get<contentArticleServiceApi.ArticleServiceClient>("acme.content.v1.ArticleService");
  let pageToken1 = "";
  do {
    const page = await call<contentArticleServiceApi.SearchArticlesRequest, contentArticleServiceApi.SearchArticlesResponse>((request, done) =>
      client1.searchArticles(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      contentArticleServiceApi.SearchArticlesRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken1 } }));
    await Promise.all(page.articles.map(async (record) => {
      await call<contentArticleServiceApi.GetArticleRequest, contentArticleServiceApi.GetArticleResponse>((request, done) =>
        client1.getArticle(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        contentArticleServiceApi.GetArticleRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          articleId: record.articleId }));
    }));
    pageToken1 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken1);
  const client2 = clients.get<experimentsExperimentServiceApi.ExperimentServiceClient>("acme.experiments.v1.ExperimentService");
  let pageToken2 = "";
  do {
    const page = await call<experimentsExperimentServiceApi.ListExperimentsRequest, experimentsExperimentServiceApi.ListExperimentsResponse>((request, done) =>
      client2.listExperiments(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      experimentsExperimentServiceApi.ListExperimentsRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken2 } }));
    await Promise.all(page.experiments.map(async (record) => {
      await call<experimentsExperimentServiceApi.GetExperimentRequest, experimentsExperimentServiceApi.GetExperimentResponse>((request, done) =>
        client2.getExperiment(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        experimentsExperimentServiceApi.GetExperimentRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          experimentId: record.experimentId }));
    }));
    pageToken2 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken2);
  const client3 = clients.get<experimentsExperimentServiceApi.ExperimentServiceClient>("acme.experiments.v1.ExperimentService");
  let pageToken3 = "";
  do {
    const page = await call<experimentsExperimentServiceApi.SearchExperimentsRequest, experimentsExperimentServiceApi.SearchExperimentsResponse>((request, done) =>
      client3.searchExperiments(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      experimentsExperimentServiceApi.SearchExperimentsRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken3 } }));
    await Promise.all(page.experiments.map(async (record) => {
      await call<experimentsExperimentServiceApi.GetExperimentRequest, experimentsExperimentServiceApi.GetExperimentResponse>((request, done) =>
        client3.getExperiment(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        experimentsExperimentServiceApi.GetExperimentRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          experimentId: record.experimentId }));
    }));
    pageToken3 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken3);
  const client4 = clients.get<formsFormServiceApi.FormServiceClient>("acme.forms.v1.FormService");
  let pageToken4 = "";
  do {
    const page = await call<formsFormServiceApi.ListFormsRequest, formsFormServiceApi.ListFormsResponse>((request, done) =>
      client4.listForms(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      formsFormServiceApi.ListFormsRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken4 } }));
    await Promise.all(page.forms.map(async (record) => {
      await call<formsFormServiceApi.GetFormRequest, formsFormServiceApi.GetFormResponse>((request, done) =>
        client4.getForm(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        formsFormServiceApi.GetFormRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          formId: record.formId }));
    }));
    pageToken4 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken4);
  const client5 = clients.get<formsFormServiceApi.FormServiceClient>("acme.forms.v1.FormService");
  let pageToken5 = "";
  do {
    const page = await call<formsFormServiceApi.SearchFormsRequest, formsFormServiceApi.SearchFormsResponse>((request, done) =>
      client5.searchForms(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      formsFormServiceApi.SearchFormsRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken5 } }));
    await Promise.all(page.forms.map(async (record) => {
      await call<formsFormServiceApi.GetFormRequest, formsFormServiceApi.GetFormResponse>((request, done) =>
        client5.getForm(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        formsFormServiceApi.GetFormRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          formId: record.formId }));
    }));
    pageToken5 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken5);
  const client6 = clients.get<localizationTranslationKeyServiceApi.TranslationKeyServiceClient>("acme.localization.v1.TranslationKeyService");
  let pageToken6 = "";
  do {
    const page = await call<localizationTranslationKeyServiceApi.SearchTranslationKeysRequest, localizationTranslationKeyServiceApi.SearchTranslationKeysResponse>((request, done) =>
      client6.searchTranslationKeys(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      localizationTranslationKeyServiceApi.SearchTranslationKeysRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken6 } }));
    await Promise.all(page.translationKeys.map(async (record) => {
      await call<localizationTranslationKeyServiceApi.GetTranslationKeyRequest, localizationTranslationKeyServiceApi.GetTranslationKeyResponse>((request, done) =>
        client6.getTranslationKey(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        localizationTranslationKeyServiceApi.GetTranslationKeyRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          translationKeyId: record.translationKeyId }));
    }));
    pageToken6 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken6);
  const client7 = clients.get<mediaMediaAssetServiceApi.MediaAssetServiceClient>("acme.media.v1.MediaAssetService");
  let pageToken7 = "";
  do {
    const page = await call<mediaMediaAssetServiceApi.ListMediaAssetsRequest, mediaMediaAssetServiceApi.ListMediaAssetsResponse>((request, done) =>
      client7.listMediaAssets(request, metadata,
        { deadline: Date.now() + 30_000 }, done),
      mediaMediaAssetServiceApi.ListMediaAssetsRequest.fromPartial({ context: { tenantId: config.tenant, actor },
        page: { pageSize: 100, pageToken: pageToken7 } }));
    await Promise.all(page.mediaAssets.map(async (record) => {
      await call<mediaMediaAssetServiceApi.GetMediaAssetRequest, mediaMediaAssetServiceApi.GetMediaAssetResponse>((request, done) =>
        client7.getMediaAsset(request, metadata,
          { deadline: Date.now() + 15_000 }, done),
        mediaMediaAssetServiceApi.GetMediaAssetRequest.fromPartial({ context: { tenantId: config.tenant, actor },
          mediaAssetId: record.mediaAssetId }));
    }));
    pageToken7 = page.pageInfo?.nextPageToken ?? "";
  } while (pageToken7);
} finally { await app.close(); }
