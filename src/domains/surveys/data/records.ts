/**
 * Persistence mappings owned by the surveys team.
 */

import * as surveysSurveysApi from "../../../../.cache/proto/acme/surveys/v1/surveys.js";

export interface StoredRecord {
  tenantId: string;
  recordId: string;
  kind: string;
  document: unknown;
}

/**
 * Map question API values to the database document boundary.
 */
export function toQuestionRecord(tenantId: string, value: surveysSurveysApi.Question): StoredRecord {
  return { tenantId, recordId: value.questionId, kind: "question",
    document: surveysSurveysApi.Question.toJSON(value) };
}

export function fromQuestionRecord(record: StoredRecord): surveysSurveysApi.Question {
  return surveysSurveysApi.Question.fromJSON(record.document);
}

/**
 * Map survey API values to the database document boundary.
 */
export function toSurveyRecord(tenantId: string, value: surveysSurveysApi.Survey): StoredRecord {
  return { tenantId, recordId: value.surveyId, kind: "survey",
    document: surveysSurveysApi.Survey.toJSON(value) };
}

export function fromSurveyRecord(record: StoredRecord): surveysSurveysApi.Survey {
  return surveysSurveysApi.Survey.fromJSON(record.document);
}

/**
 * Map survey response API values to the database document boundary.
 */
export function toSurveyResponseRecord(tenantId: string, value: surveysSurveysApi.SurveyResponse): StoredRecord {
  return { tenantId, recordId: value.surveyResponseId, kind: "survey_response",
    document: surveysSurveysApi.SurveyResponse.toJSON(value) };
}

export function fromSurveyResponseRecord(record: StoredRecord): surveysSurveysApi.SurveyResponse {
  return surveysSurveysApi.SurveyResponse.fromJSON(record.document);
}
