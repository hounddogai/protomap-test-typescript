import * as text from "../../../../kit/text.js";

/** Where a post preference is in its life cycle. */
export type PostPreferenceStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** One post preference, with what the planners need to act on it. */
export class PostPreference {
  code: string;
  name: string;
  score: number;
  notes: string;
  archived: boolean;
  category: string;
  minimum: number;
  threshold: number;
  utmSource: string;
  channel: string;
  quantity: number;
  status: PostPreferenceStatus;

  constructor(
    code: string,
    name: string,
    score: number,
    notes: string,
    archived: boolean,
    category: string,
    minimum: number,
    threshold: number,
    utmSource: string,
    channel: string,
    quantity: number,
    status: PostPreferenceStatus,
  ) {
    this.code = code;
    this.name = name;
    this.score = score;
    this.notes = notes;
    this.archived = archived;
    this.category = category;
    this.minimum = minimum;
    this.threshold = threshold;
    this.utmSource = utmSource;
    this.channel = channel;
    this.quantity = quantity;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostPreferenceStatus): boolean {
    switch (this.status) {
      case "proposed":
        switch (next) {
          case "rejected":
          case "withdrawn":
            return true;
        }
        return false;
      case "approved":
        return next === "rejected" || next === "withdrawn";
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PostPreferenceStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post preference ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"post preference"} ${this.code}`;
  }

  netExposure(): number {
    return Math.round(this.minimum * this.threshold * 100) / 100;
  }

  copy(): PostPreference {
    return new PostPreference(
      this.code,
      this.name,
      this.score,
      this.notes,
      this.archived,
      this.category,
      this.minimum,
      this.threshold,
      this.utmSource,
      this.channel,
      this.quantity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a post preference in status proposed. */
export function newPostPreference(code: string, name: string): PostPreference {
  return new PostPreference(code, name, 0, "", false, "", 0, 0, "", "", 0, "proposed");
}
