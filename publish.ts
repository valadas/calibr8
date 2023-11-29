import * as ghpages from 'gh-pages';

console.log('Hello World');

declare module 'gh-pages' {
    export interface PublishOptions {
        cname?: string | undefined;
    }
}

ghpages.publish(
    "www",
    {
        cname: "calibr8.xyz",
    },
    error => console.error(error));