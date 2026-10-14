import * as text from "../../../../kit/text.js";

/** Where a reward snapshot is in its life cycle. */
export type RewardSnapshotStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One reward snapshot, with what the planners need to act on it. */
export class RewardSnapshot {
  code: string;
  label: string;
  version: number;
  channel: string;
  name: string;
  visible: boolean;
  rate: number;
  variant: string;
  attributes: Map<string, string>;
  sequence: number;
  status: RewardSnapshotStatus;

  constructor(
    code: string,
    label: string,
    version: number,
    channel: string,
    name: string,
    visible: boolean,
    rate: number,
    variant: string,
    attributes: Map<string, string>,
    sequence: number,
    status: RewardSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.version = version;
    this.channel = channel;
    this.name = name;
    this.visible = visible;
    this.rate = rate;
    this.variant = variant;
    this.attributes = attributes;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: RewardSnapshotStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "resolved":
            return true;
        }
        return false;
      case "in_review":
        return next === "resolved";
      case "resolved":
        return next === "reopened" || next === "archived";
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: RewardSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reward snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"reward snapshot"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveLoad(): number {
    return Math.round(this.sequence * this.version * 100) / 100;
  }

  copy(): RewardSnapshot {
    return new RewardSnapshot(
      this.code,
      this.label,
      this.version,
      this.channel,
      this.name,
      this.visible,
      this.rate,
      this.variant,
      this.attributes,
      this.sequence,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a reward snapshot in status open. */
export function newRewardSnapshot(code: string, label: string): RewardSnapshot {
  return new RewardSnapshot(code, label, 0, "", "", false, 0, "", new Map<string, string>(), 0, "open");
}
