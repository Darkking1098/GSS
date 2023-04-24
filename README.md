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
    p:padding ## can be accessed as @p ##
    px:padding-inline 
    br:border-radius 
    c:color 
    cube:width,height ## multiple properties ##
    shadow:box-shadow
```
 - `@color` Define Colors (Use hex code only)
```
@color
    red:#FF0000
    pink:#FF00FF
    blue:#0000FF
 ```
  - Using defined props
```
.temp @br-10px ## Defined props can also be used inline ##
    @p:100px
    margin:40px 20px
 ```
   - `@col/color-opacity` Using defined Color
```
.temp
    color:@col/pink 
    background:@col/red-10 ## -10 is opacity in percentage ##
 ```
   - Nesting elements
```
h1
    @c:red
    :hover
        @c:@col/pink
    span
        background:black
        @c:white
        :hover
            @c:black
            background:red
 ```
 - `@h-` Inline Hovering
```
h1
    @c:red @h-@col/pink-90
    span
        background:black @h-red
        @c:white @h-black
 ```
