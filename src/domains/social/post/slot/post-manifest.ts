import * as text from "../../../../kit/text.js";

/** Where a post manifest is in its life cycle. */
export type PostManifestStatus = "new" | "queued" | "running" | "done" | "failed";

/** One post manifest, with what the planners need to act on it. */
export class PostManifest {
  code: string;
  title: string;
  ceiling: number;
  rate: number;
  amount: number;
  sequence: number;
  version: number;
  budget: number;
  label: string;
  channel: string;
  status: PostManifestStatus;

  constructor(
    code: string,
    title: string,
    ceiling: number,
    rate: number,
    amount: number,
    sequence: number,
    version: number,
    budget: number,
    label: string,
    channel: string,
    status: PostManifestStatus,
  ) {
    this.code = code;
    this.title = title;
    this.ceiling = ceiling;
    this.rate = rate;
    this.amount = amount;
    this.sequence = sequence;
    this.version = version;
    this.budget = budget;
    this.label = label;
    this.channel = channel;
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

  canMoveTo(next: PostManifestStatus): boolean {
    switch (this.status) {
      case "new":
        return next === "done";
      case "queued":
        switch (next) {
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

  moveTo(next: PostManifestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post manifest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${"post manifest"} ${this.code}`;
  }

  projectedTotal(): number {
    return Math.round((this.budget - this.amount) * 100) / 100;
  }

  copy(): PostManifest {
    return new PostManifest(
      this.code,
      this.title,
      this.ceiling,
      this.rate,
      this.amount,
      this.sequence,
      this.version,
      this.budget,
      this.label,
      this.channel,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a post manifest in status new. */
export function newPostManifest(code: string, title: string): PostManifest {
  return new PostManifest(code, title, 0, 0, 0, 0, 0, 0, "", "", "new");
}
