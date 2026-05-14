declare module '@strapi/design-system/*';
declare module '@strapi/design-system';

declare module '*.css';

declare module '*.png' {
  const src: string;
  export default src;
}
