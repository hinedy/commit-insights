export interface Commit {
  hash: string;
  parents: string[];
  authorName: string;
  authorEmail: string;
  date: string;
  subject: string;
  body: string;
}
