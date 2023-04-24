# GSS

### Requirements

GSS in built with grapple, so you have to include grapple.js as well

### Grapple style sheets

GSS is css pre-processor that makes styling more easy.

### Features
 
 - Parent nesting
 - Contains extend styles from element
 - give capabilty to define own shorten syntax
 - Added color modifier
 - Indentation based structure
 - inline screen size compatibility with selectors 
 - inline screen size compatibility style props
 
 ### Functions
 - `@def` Define short syntax
 ```
@def 
    p:padding
    px:padding-inline
    br:border-radius
    cube:width,height (multiple properties)
    shadow:box-shadow
```
 - `@def` Define Colors ## Use hex code only ##
```
@color
    red:#FF0000
    pink:#FF00FF
    blue:#0000FF
 ```
