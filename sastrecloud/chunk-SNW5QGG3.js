import*as r from"@angular/core";import{SecurityContext as d}from"@angular/core";var m=(()=>{class e{static \u0275fac=function(n){return new(n||e)};static \u0275cmp=r.\u0275\u0275defineComponent({type:e,selectors:[["ng-component"]],exportAs:["cdkVisuallyHidden"],decls:0,vars:0,template:function(n,c){},styles:[`.cdk-visually-hidden {
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
  white-space: nowrap;
  outline: 0;
  -webkit-appearance: none;
  -moz-appearance: none;
  left: 0;
}
[dir=rtl] .cdk-visually-hidden {
  left: auto;
  right: 0;
}
`],encapsulation:2,changeDetection:0})}return e})(),t;function a(){if(t===void 0&&(t=null,typeof window<"u")){let e=window;e.trustedTypes!==void 0&&(t=e.trustedTypes.createPolicy("angular#components",{createHTML:i=>i}))}return t}function l(e){return a()?.createHTML(e)||e}function g(e,i,o){let n=o.sanitize(d.HTML,i);e.innerHTML=l(n||"")}export{m as a,l as b,g as c};
