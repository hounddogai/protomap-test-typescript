import * as text from "../../../../kit/text.js";
import { CappedRewardRuleNotice } from "./capped-reward-rule-notice.js";

/** How screens and exports show a capped reward rule notice. */
export class CappedRewardRuleNoticeView {
  codeText: string;
  labelText: string;
  archivedText: string;
  name: string;
  externalRef: string;
  expiresAt: string;
  ownerId: string;
  sequenceText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    labelText: string,
    archivedText: string,
    name: string,
    externalRef: string,
    expiresAt: string,
    ownerId: string,
    sequenceText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.labelText = labelText;
    this.archivedText = archivedText;
    this.name = name;
    this.externalRef = externalRef;
    this.expiresAt = expiresAt;
    this.ownerId = ownerId;
    this.sequenceText = sequenceText;
    this.statusLabel = statusLabel;
  }
}

export function toCappedRewardRuleNoticeView(item: CappedRewardRuleNotice): CappedRewardRuleNoticeView {
  return new CappedRewardRuleNoticeView(
    item.code,
    item.label,
    `${item.archived}`,
    text.truncate(item.name, 80),
    item.externalRef,
    String(item.expiresAt),
    item.ownerId,
    String(item.sequence),
    `${item.status}`.toUpperCase(),
  );
}

export function toCappedRewardRuleNoticeViews(items: CappedRewardRuleNotice[]): CappedRewardRuleNoticeView[] {
  const views: CappedRewardRuleNoticeView[] = [];
  for (const item of items) {
    views.push(toCappedRewardRuleNoticeView(item));
  }
  return views;
}

export function sumCappedRewardRuleNoticeView(view: CappedRewardRuleNoticeView): number {
  const parsedExpiresAt = Number(view.expiresAt);
  if (Number.isNaN(parsedExpiresAt)) throw new Error(`parse expires at: ${view.expiresAt} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedExpiresAt + parsedSequence;
}
