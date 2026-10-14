import { MentionRule } from "./mention-rule.js";

/** How screens and exports show a mention rule. */
export class MentionRuleView {
  code: string;
  title: string;
  versionText: string;
  country: string;
  pinnedText: string;
  statusLabel: string;

  constructor(
    code: string,
    title: string,
    versionText: string,
    country: string,
    pinnedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.title = title;
    this.versionText = versionText;
    this.country = country;
    this.pinnedText = pinnedText;
    this.statusLabel = statusLabel;
  }
}

export function toMentionRuleView(item: MentionRule): MentionRuleView {
  return new MentionRuleView(
    item.code,
    item.title,
    String(item.version),
    item.country,
    `${item.pinned}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toMentionRuleViews(items: MentionRule[]): MentionRuleView[] {
  const views: MentionRuleView[] = [];
  for (const item of items) {
    views.push(toMentionRuleView(item));
  }
  return views;
}

export function sumMentionRuleView(view: MentionRuleView): number {
  const parsedVersion = Number(view.versionText);
  if (Number.isNaN(parsedVersion)) throw new Error(`parse version: ${view.versionText} is not a number`);
  return parsedVersion;
}
