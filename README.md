MindMup MapJs
=============

[![Build Status](https://api.travis-ci.org/mindmup/mapjs.png)](http://travis-ci.org/mindmup/mapjs)

MindMup is a zero-friction mind map canvas. Our aim is to create the most productive mind mapping environment out there, removing
all the distractions and providing powerful editing shortcuts. 

This git project is the JavaScript visualisation portion of MindMup. It provides a canvas for users to create and edit
mind maps in a browser. You can see an example of this live on http://www.mindmup.com.

This project is relatively stand alone and you can use it to create a nice mind map visualisation separate from the mindmup server.

Dependencies
------------

The visualisation library depends on several other 3rd party javascript libraries. In order to execute the code from this project, you'll need
to link to those libraries first. For convenience, we provide a dl_dependencies.sh script that will pull those libraries and put in the lib folder,
where our tests expect them. Make sure to run that script the first time you download the project, or link to the correct libraries in your code.

- [Kinetic JS 4.2.0](http://kineticjs.com/)
- [JQuery 1.9.0](http://jquery.com/)
- [Underscore.Js 1.4.3](http://underscorejs.org/)

Testing
-------

The library is extensively tested with Jasmine unit tests in the test folder. 

Jasmine 1.2.0 is required to run the tests, and provided in test-lib folder. There are two ways of running tests.

- Visual: Open test/SpecRunner.html in a browser, this will run all Jasmine tests

- Automated: Using [PhantomJs](phantomjs.org), in the test folder, run
      sh runtests.sh

Please note that the CI server uses phantomjs, so make sure that tests run with phantom before committing. 
    
For manual visual testing, open test/index.html. This is an example canvas that loads up a relevant mind map.

