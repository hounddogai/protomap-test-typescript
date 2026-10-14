import * as text from "../../../../kit/text.js";

/** Where a activation manifest is in its life cycle. */
export type ActivationManifestStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A activation manifest. Its code is unique within a tenant. */
export class ActivationManifest {
  code: string;
  label: string;
  channel: string;
  title: string;
  frequencyCap: number;
  createdAt: number;
  sequence: number;
  pinned: boolean;
  summary: string;
  score: number;
  campaignRef: string;
  status: ActivationManifestStatus;

  constructor(
    code: string,
    label: string,
    channel: string,
    title: string,
    frequencyCap: number,
    createdAt: number,
    sequence: number,
    pinned: boolean,
    summary: string,
    score: number,
    campaignRef: string,
    status: ActivationManifestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.channel = channel;
    this.title = title;
    this.frequencyCap = frequencyCap;
    this.createdAt = createdAt;
    this.sequence = sequence;
    this.pinned = pinned;
    this.summary = summary;
    this.score = score;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: ActivationManifestStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active";
      case "pending":
        return next === "suspended" || next === "closed";
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

  moveTo(next: ActivationManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`activation manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  effectiveExposure(): number {
    return Math.round((this.frequencyCap - this.sequence) * 100) / 100;
  }

  copy(): ActivationManifest {
    return new ActivationManifest(
      this.code,
      this.label,
      this.channel,
      this.title,
      this.frequencyCap,
      this.createdAt,
      this.sequence,
      this.pinned,
      this.summary,
      this.score,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a activation manifest in status draft. */
export function newActivationManifest(code: string, label: string): ActivationManifest {
  return new ActivationManifest(code, label, "", "", 0, 0, 0, false, "", 0, "", "draft");
}
