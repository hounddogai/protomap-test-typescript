import * as text from "../../../../kit/text.js";

/** Where a mention manifest is in its life cycle. */
export type MentionManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A mention manifest as the mention team keeps it. */
export class MentionManifest {
  code: string;
  name: string;
  active: boolean;
  impressions: number;
  reviewer: string;
  description: string;
  status: MentionManifestStatus;

  constructor(
    code: string,
    name: string,
    active: boolean,
    impressions: number,
    reviewer: string,
    description: string,
    status: MentionManifestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.active = active;
    this.impressions = impressions;
    this.reviewer = reviewer;
    this.description = description;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: MentionManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        switch (next) {
          case "pending":
            return true;
        }
        return false;
      case "pending":
        return next === "suspended";
      case "active":
        return next === "closed";
      case "suspended":
        switch (next) {
          case "closed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: MentionManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code}: ${this.name}`;
  }

  measuredValue(): number {
    return this.impressions;
  }

  copy(): MentionManifest {
    return new MentionManifest(
      this.code,
      this.name,
      this.active,
      this.impressions,
      this.reviewer,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a mention manifest in status draft. */
export function newMentionManifest(code: string, name: string): MentionManifest {
  return new MentionManifest(code, name, false, 0, "", "", "draft");
}
