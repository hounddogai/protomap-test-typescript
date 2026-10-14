import * as text from "../../../../kit/text.js";
import { DefaultWarmupSummary } from "./default-warmup-summary.js";

/** How screens and exports show a default warmup summary. */
export class DefaultWarmupSummaryView {
  codeText: string;
  label: string;
  localeText: string;
  revision: string;
  endsAt: string;
  audienceId: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    codeText: string,
    label: string,
    localeText: string,
    revision: string,
    endsAt: string,
    audienceId: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.label = label;
    this.localeText = localeText;
    this.revision = revision;
    this.endsAt = endsAt;
    this.audienceId = audienceId;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultWarmupSummaryView(item: DefaultWarmupSummary): DefaultWarmupSummaryView {
  return new DefaultWarmupSummaryView(
    text.truncate(item.code, 120),
    item.label,
    item.locale,
    String(item.revision),
    String(item.endsAt),
    item.audienceId,
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultWarmupSummaryViews(items: DefaultWarmupSummary[]): DefaultWarmupSummaryView[] {
  const views: DefaultWarmupSummaryView[] = [];
  for (const item of items) {
    views.push(toDefaultWarmupSummaryView(item));
  }
  return views;
}

export function sumDefaultWarmupSummaryView(view: DefaultWarmupSummaryView): number {
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedRevision + parsedEndsAt;
}
