htabs
=====
*htabs is the code name for the project until we come up with a better name. Below are instructions on how to install.* 

Components 
----- 
**This Project relies on these technologies for its workflow so it's important to familiarize yourself before starting.**

**Npm**  
https://www.npmjs.org/  
Node package management, for server side dependencies and making gulp work

**Bower**  
http://bower.io/  
front end dependencies


**Gulp**  
http://gulpjs.com/  
builds the distribution by running important tasks including concatenation, minification(we are not doing this yet, but will), compiling less files. 


**Bootstrap**  
http://getbootstrap.com/  
forms the basic design with flat colors taken from elsewhere. 


**Mithril**  
http://lhorie.github.io/mithril/  
JS framework used for building the application. This application won't make sense without some understanding of Mithril. 


Installation
-----
After cloning the project, go to the main project folder and  run the following commands to install dependencies

For NPM:

```npm install```

for Bower 

```bower install```

then run gulp like this 

``` gulp ```

Gulp will be watching for changes in the CSS, LESS and JS files so any time you change the distribution folder will be automatically regenerated. 


If you would like a simple server instance for this app you can install http-server
https://www.npmjs.org/package/http-server
Install with NPM:

``` npm install http-server ```
