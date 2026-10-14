import { ExitRuleMapping } from "./exit-rule-mapping.js";

/** How screens and exports show a exit rule mapping. */
export class ExitRuleMappingView {
  code: string;
  titleText: string;
  phone: string;
  sequenceText: string;
  contactEmail: string;
  statusLabel: string;

  constructor(
    code: string,
    titleText: string,
    phone: string,
    sequenceText: string,
    contactEmail: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.titleText = titleText;
    this.phone = phone;
    this.sequenceText = sequenceText;
    this.contactEmail = contactEmail;
    this.statusLabel = statusLabel;
  }
}

export function toExitRuleMappingView(item: ExitRuleMapping): ExitRuleMappingView {
  return new ExitRuleMappingView(
    item.code,
    item.title,
    item.phone,
    String(item.sequence),
    item.contactEmail,
    `${item.status}`.toUpperCase(),
  );
}

export function toExitRuleMappingViews(items: ExitRuleMapping[]): ExitRuleMappingView[] {
  const views: ExitRuleMappingView[] = [];
  for (const item of items) {
    views.push(toExitRuleMappingView(item));
  }
  return views;
}

export function sumExitRuleMappingView(view: ExitRuleMappingView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  return parsedSequence;
}
