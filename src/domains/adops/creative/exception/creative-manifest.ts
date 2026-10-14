import * as text from "../../../../kit/text.js";

/** Where a creative manifest is in its life cycle. */
export type CreativeManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** The record of a creative manifest and its current status. */
export class CreativeManifest {
  code: string;
  name: string;
  audienceId: string;
  limit: number;
  tags: string[];
  segment: string;
  margin: number;
  approved: boolean;
  cost: number;
  ratio: number;
  status: CreativeManifestStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    limit: number,
    tags: string[],
    segment: string,
    margin: number,
    approved: boolean,
    cost: number,
    ratio: number,
    status: CreativeManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.limit = limit;
    this.tags = tags;
    this.segment = segment;
    this.margin = margin;
    this.approved = approved;
    this.cost = cost;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreativeManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "queued" || next === "running";
      case "queued":
        switch (next) {
          case "running":
          case "failed":
            return true;
        }
        return false;
      case "running":
        return next === "done" || next === "failed";
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: CreativeManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveLoad(): number {
    return Math.round((this.cost + this.limit) * 100) / 100;
  }

  copy(): CreativeManifest {
    return new CreativeManifest(
      this.code,
      this.name,
      this.audienceId,
      this.limit,
      this.tags,
      this.segment,
      this.margin,
      this.approved,
      this.cost,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.segment);
  }
}

/** Starts a creative manifest in status new. */
export function newCreativeManifest(code: string, name: string): CreativeManifest {
  return new CreativeManifest(code, name, "", 0, [], "", 0, false, 0, 0, "new");
}
