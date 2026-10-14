import * as text from "../../../../kit/text.js";

/** Where a weighted preference request is in its life cycle. */
export type WeightedPreferenceRequestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One weighted preference request, with what the planners need to act on it. */
export class WeightedPreferenceRequest {
  code: string;
  name: string;
  expiresAt: number;
  variant: string;
  source: string;
  campaignRef: string;
  status: WeightedPreferenceRequestStatus;

  constructor(
    code: string,
    name: string,
    expiresAt: number,
    variant: string,
    source: string,
    campaignRef: string,
    status: WeightedPreferenceRequestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.expiresAt = expiresAt;
    this.variant = variant;
    this.source = source;
    this.campaignRef = campaignRef;
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

  canMoveTo(next: WeightedPreferenceRequestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "failed";
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "done":
        return next === "failed";
    }
    return false;
  }

  moveTo(next: WeightedPreferenceRequestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`weighted preference request ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  measuredValue(): number {
    return this.expiresAt;
  }

  copy(): WeightedPreferenceRequest {
    return new WeightedPreferenceRequest(
      this.code,
      this.name,
      this.expiresAt,
      this.variant,
      this.source,
      this.campaignRef,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a weighted preference request in status new. */
export function newWeightedPreferenceRequest(code: string, name: string): WeightedPreferenceRequest {
  return new WeightedPreferenceRequest(code, name, 0, "", "", "", "new");
}
