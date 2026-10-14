import * as text from "../../../../kit/text.js";
import { CreativeCheckpoint } from "./creative-checkpoint.js";

/** How screens and exports show a creative checkpoint. */
export class CreativeCheckpointView {
  codeText: string;
  nameText: string;
  createdAt: string;
  ownerId: string;
  revision: string;
  startsAt: string;
  cohort: string;
  approved: string;
  retries: string;
  statusLabel: string;

  constructor(
    codeText: string,
    nameText: string,
    createdAt: string,
    ownerId: string,
    revision: string,
    startsAt: string,
    cohort: string,
    approved: string,
    retries: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.nameText = nameText;
    this.createdAt = createdAt;
    this.ownerId = ownerId;
    this.revision = revision;
    this.startsAt = startsAt;
    this.cohort = cohort;
    this.approved = approved;
    this.retries = retries;
    this.statusLabel = statusLabel;
  }
}

export function toCreativeCheckpointView(item: CreativeCheckpoint): CreativeCheckpointView {
  return new CreativeCheckpointView(
    item.code,
    item.name,
    String(item.createdAt),
    text.truncate(item.ownerId, 120),
    String(item.revision),
    String(item.startsAt),
    item.cohort,
    `${item.approved}`,
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toCreativeCheckpointViews(items: CreativeCheckpoint[]): CreativeCheckpointView[] {
  const views: CreativeCheckpointView[] = [];
  for (const item of items) {
    views.push(toCreativeCheckpointView(item));
  }
  return views;
}

export function sumCreativeCheckpointView(view: CreativeCheckpointView): number {
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  const parsedRevision = Number(view.revision);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revision} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedCreatedAt + parsedRevision + parsedStartsAt;
}
