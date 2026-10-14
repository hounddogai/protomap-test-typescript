import { ApprovalAgreement } from "./approval-agreement.js";

/** How screens and exports show a approval agreement. */
export class ApprovalAgreementView {
  code: string;
  nameText: string;
  segment: string;
  margin: string;
  title: string;
  ratio: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    segment: string,
    margin: string,
    title: string,
    ratio: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.segment = segment;
    this.margin = margin;
    this.title = title;
    this.ratio = ratio;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalAgreementView(item: ApprovalAgreement): ApprovalAgreementView {
  return new ApprovalAgreementView(
    item.code,
    item.name,
    item.segment,
    item.margin.toFixed(2),
    item.title,
    item.ratio.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalAgreementViews(items: ApprovalAgreement[]): ApprovalAgreementView[] {
  const views: ApprovalAgreementView[] = [];
  for (const item of items) {
    views.push(toApprovalAgreementView(item));
  }
  return views;
}

export function sumApprovalAgreementView(view: ApprovalAgreementView): number {
  const parsedMargin = Number(view.margin);
  if (Number.isNaN(parsedMargin)) throw new Error(`parse margin: ${view.margin} is not a number`);
  const parsedRatio = Number(view.ratio);
  if (Number.isNaN(parsedRatio)) throw new Error(`parse ratio: ${view.ratio} is not a number`);
  return parsedMargin + parsedRatio;
}
