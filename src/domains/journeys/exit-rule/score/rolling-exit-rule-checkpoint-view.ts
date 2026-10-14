import * as text from "../../../../kit/text.js";
import { RollingExitRuleCheckpoint } from "./rolling-exit-rule-checkpoint.js";

/** How screens and exports show a rolling exit rule checkpoint. */
export class RollingExitRuleCheckpointView {
  codeText: string;
  nameText: string;
  amount: string;
  frequencyCap: string;
  revisionText: string;
  campaignRef: string;
  windowDays: string;
  createdAtText: string;
  audienceIdText: string;
  title: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    amount: string,
    frequencyCap: string,
    revisionText: string,
    campaignRef: string,
    windowDays: string,
    createdAtText: string,
    audienceIdText: string,
    title: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.amount = amount;
    this.frequencyCap = frequencyCap;
    this.revisionText = revisionText;
    this.campaignRef = campaignRef;
    this.windowDays = windowDays;
    this.createdAtText = createdAtText;
    this.audienceIdText = audienceIdText;
    this.title = title;
    this.statusLabel = statusLabel;
  }
}

export function toRollingExitRuleCheckpointView(item: RollingExitRuleCheckpoint): RollingExitRuleCheckpointView {
  return new RollingExitRuleCheckpointView(
    item.code,
    item.name,
    item.amount.toFixed(2),
    String(item.frequencyCap),
    String(item.revision),
    text.truncate(item.campaignRef, 40),
    String(item.windowDays),
    String(item.createdAt),
    item.audienceId,
    text.truncate(item.title, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingExitRuleCheckpointViews(items: RollingExitRuleCheckpoint[]): RollingExitRuleCheckpointView[] {
  const views: RollingExitRuleCheckpointView[] = [];
  for (const item of items) {
    views.push(toRollingExitRuleCheckpointView(item));
  }
  return views;
}

export function sumRollingExitRuleCheckpointView(view: RollingExitRuleCheckpointView): number {
  const parsedAmount = Number(view.amount);
  if (Number.isNaN(parsedAmount)) throw new Error(`parse amount: ${view.amount} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  return parsedAmount + parsedFrequencyCap + parsedRevision;
}
