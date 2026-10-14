import { NudgeRequest } from "./nudge-request.js";

/** How screens and exports show a nudge request. */
export class NudgeRequestView {
  codeText: string;
  nameText: string;
  frequencyCap: string;
  approvedText: string;
  visible: string;
  sequence: string;
  sendAtText: string;
  currency: string;
  floorValue: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    frequencyCap: string,
    approvedText: string,
    visible: string,
    sequence: string,
    sendAtText: string,
    currency: string,
    floorValue: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.frequencyCap = frequencyCap;
    this.approvedText = approvedText;
    this.visible = visible;
    this.sequence = sequence;
    this.sendAtText = sendAtText;
    this.currency = currency;
    this.floorValue = floorValue;
    this.statusLabel = statusLabel;
  }
}

export function toNudgeRequestView(item: NudgeRequest): NudgeRequestView {
  return new NudgeRequestView(
    item.code,
    item.name,
    String(item.frequencyCap),
    `${item.approved}`,
    `${item.visible}`,
    String(item.sequence),
    String(item.sendAt),
    item.currency,
    item.floorValue.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toNudgeRequestViews(items: NudgeRequest[]): NudgeRequestView[] {
  const views: NudgeRequestView[] = [];
  for (const item of items) {
    views.push(toNudgeRequestView(item));
  }
  return views;
}

export function sumNudgeRequestView(view: NudgeRequestView): number {
  const parsedFrequencyCap = Number(view.frequencyCap);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCap} is not a number`);
  const parsedSequence = Number(view.sequence);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequence} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedFrequencyCap + parsedSequence + parsedSendAt;
}
