import * as text from "../../../../kit/text.js";
import { ReplyAssignment } from "./reply-assignment.js";

/** How screens and exports show a reply assignment. */
export class ReplyAssignmentView {
  codeText: string;
  name: string;
  audienceId: string;
  maximum: string;
  sequenceText: string;
  title: string;
  sendAt: string;
  label: string;
  batchSize: string;
  score: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    audienceId: string,
    maximum: string,
    sequenceText: string,
    title: string,
    sendAt: string,
    label: string,
    batchSize: string,
    score: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.audienceId = audienceId;
    this.maximum = maximum;
    this.sequenceText = sequenceText;
    this.title = title;
    this.sendAt = sendAt;
    this.label = label;
    this.batchSize = batchSize;
    this.score = score;
    this.statusLabel = statusLabel;
  }
}

export function toReplyAssignmentView(item: ReplyAssignment): ReplyAssignmentView {
  return new ReplyAssignmentView(
    item.code,
    item.name,
    item.audienceId,
    item.maximum.toFixed(2),
    String(item.sequence),
    text.truncate(item.title, 40),
    String(item.sendAt),
    text.truncate(item.label, 120),
    String(item.batchSize),
    item.score.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toReplyAssignmentViews(items: ReplyAssignment[]): ReplyAssignmentView[] {
  const views: ReplyAssignmentView[] = [];
  for (const item of items) {
    views.push(toReplyAssignmentView(item));
  }
  return views;
}

export function sumReplyAssignmentView(view: ReplyAssignmentView): number {
  const parsedMaximum = Number(view.maximum);
  if (Number.isNaN(parsedMaximum)) throw new Error(`parse maximum: ${view.maximum} is not a number`);
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedSendAt = Number(view.sendAt);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAt} is not a number`);
  return parsedMaximum + parsedSequence + parsedSendAt;
}
