declare namespace NodeJS {
  export interface ProcessEnv {
    DATABASE_URL: string;
    REDIS_URL: string;
    PORT: string;
    ETHEREAL_USER: string;
    ETHEREAL_PASS: string;
    SESSION_SECRET: string;
    CORS_ORIGIN: string;
  }
}
