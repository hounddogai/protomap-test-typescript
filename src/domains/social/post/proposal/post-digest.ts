import * as text from "../../../../kit/text.js";

/** Where a post digest is in its life cycle. */
export type PostDigestStatus = "created" | "validated" | "published" | "retired";

/** A post digest. Its code is unique within a tenant. */
export class PostDigest {
  code: string;
  name: string;
  retries: number;
  archived: boolean;
  utmSource: string;
  tags: string[];
  status: PostDigestStatus;

  constructor(
    code: string,
    name: string,
    retries: number,
    archived: boolean,
    utmSource: string,
    tags: string[],
    status: PostDigestStatus,
  ) {
    this.code = code;
    this.name = name;
    this.retries = retries;
    this.archived = archived;
    this.utmSource = utmSource;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PostDigestStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PostDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`post digest ${this.code} cannot move from ${this.status} to ${next}`);
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

  measuredValue(): number {
    return this.retries;
  }

  copy(): PostDigest {
    return new PostDigest(this.code, this.name, this.retries, this.archived, this.utmSource, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a post digest in status created. */
export function newPostDigest(code: string, name: string): PostDigest {
  return new PostDigest(code, name, 0, false, "", [], "created");
}
