export interface ImageData {
    image: string;
    dict_of_vars: Record<string, string | number>;
  }
  
  export interface ImageDataResponse {
    expr: string;
    result: string | number;
    assign?: boolean;
  }
  