import * as text from "../../../../kit/text.js";
import { LegacyPacingAgreement } from "./legacy-pacing-agreement.js";

/** How screens and exports show a legacy pacing agreement. */
export class LegacyPacingAgreementView {
  code: string;
  title: string;
  name: string;
  archived: string;
  summary: string;
  weight: string;
  descriptionText: string;
  startsAt: string;
  segment: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    name: string,
    archived: string,
    summary: string,
    weight: string,
    descriptionText: string,
    startsAt: string,
    segment: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.name = name;
    this.archived = archived;
    this.summary = summary;
    this.weight = weight;
    this.descriptionText = descriptionText;
    this.startsAt = startsAt;
    this.segment = segment;
    this.statusLabel = statusLabel;
  }
}

export function toLegacyPacingAgreementView(item: LegacyPacingAgreement): LegacyPacingAgreementView {
  return new LegacyPacingAgreementView(
    item.code,
    item.title,
    text.truncate(item.name, 40),
    `${item.archived}`,
    item.summary,
    item.weight.toFixed(2),
    item.description,
    String(item.startsAt),
    text.truncate(item.segment, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toLegacyPacingAgreementViews(items: LegacyPacingAgreement[]): LegacyPacingAgreementView[] {
  const views: LegacyPacingAgreementView[] = [];
  for (const item of items) {
    views.push(toLegacyPacingAgreementView(item));
  }
  return views;
}

export function sumLegacyPacingAgreementView(view: LegacyPacingAgreementView): number {
  const parsedWeight = Number(view.weight);
  if (Number.isNaN(parsedWeight)) throw new Error(`parse weight: ${view.weight} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedWeight + parsedStartsAt;
}
