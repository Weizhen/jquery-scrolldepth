/*!
 * jquery.scrolldepth.js | v0.2
 * Copyright (c) 2013 Rob Flaherty (@robflaherty)
 * Licensed under the MIT and GPL licenses.
 */
;(function ( $, window, document, undefined ) {
  
  "use strict";

  var defaults = {
    elements: [],
    minHeight: 0,
    percentage: true,
    testing: false
  },

  $window = $(window),
  cache = [];

  /*
   * Plugin
   */

  $.scrollDepth = function(options) {
    
    var startTime = +new Date;

    options = $.extend({}, defaults, options);

    // Return early if document height is too small
    if ( $(document).height() < options.minHeight ) {
      return;
    }

    // Establish baseline (0% scroll)
    sendEvent('Percentage', 'Baseline');

    /*
     * Functions
     */

    function sendEvent(action, label, timing) {
      if (!options.testing) {

        if (typeof(ga) !== "undefined") {
          ga('send', 'event', 'Scroll Depth', action, label, 1, {'nonInteraction': 1});

          if (arguments.length > 2) {
            ga('send', 'timing', 'Scroll Depth', action, timing, label);
          }

        }

        if (typeof(_gaq) !== "undefined") {
          _gaq.push(['_trackEvent', 'Scroll Depth', action, label, 1, true]);

          if (arguments.length > 2) {
            _gaq.push(['_trackTiming', 'Scroll Depth', action, timing, label, 100]);
          }

        }

      } else {
        $('#console').html(action + ': ' + label);
      }
    }

    function calculateMarks(docHeight,checkPoints) { //Added checkPoints option, where array of percentages can be passed as dynamic milestone
      var r = {};
      for(var i = 0; i < checkPoints.length; i ++){
        if(checkPoints[i] == 100){
          r[checkPoints[i]] = parseInt(docHeight * 0.99, 10);
        } else {
          r[checkPoints[i]] = parseInt(docHeight * checkPoints * 0.01, 10);
        }
      }
      return r;
    }

    function checkMarks(marks, scrollDistance, timing, locks) { // added lock for same checkpoint, so one check point only fires one event.
      // Check each active mark
      $.each(marks, function(key, val) {
        if ( $.inArray(key, cache) === -1 && scrollDistance >= val && !locks[key]) {
          locks[key] = true;
          sendEvent('Percentage', key, timing);
          cache.push(key);
        }
      });
      return locks;
    }

    function checkElements(elements, scrollDistance, timing) {
      $.each(elements, function(index, elem) {
        if ( $.inArray(elem, cache) === -1 && $(elem).length ) {
          if ( scrollDistance >= $(elem).offset().top ) {
            sendEvent('Elements', elem, timing);
            cache.push(elem);
          }
        }
      });
    }

    /*
     * Throttle function borrowed from:
     * Underscore.js 1.5.2
     * http://underscorejs.org
     * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Underscore may be freely distributed under the MIT license.
     */

    function throttle(func, wait) {
      var context, args, result;
      var timeout = null;
      var previous = 0;
      var later = function() {
        previous = new Date;
        timeout = null;
        result = func.apply(context, args);
      };
      return function() {
        var now = new Date;
        if (!previous) previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0) {
          clearTimeout(timeout);
          timeout = null;
          previous = now;
          result = func.apply(context, args);
        } else if (!timeout) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    }

    /*
     * Scroll Event
     */

    $window.on('scroll.scrollDepth', throttle(function() {
      console.log('foo');
      /*
       * We calculate document and window height on each scroll event to
       * account for dynamic DOM changes.
       */

      var docHeight = $(document).height(),
        winHeight = window.innerHeight ? window.innerHeight : $window.height(),
        scrollDistance = $window.scrollTop() + winHeight,

        // Set check points in percent for scrolling journey
        milestones = [10,15,88],

        //
        locks = {};

        for (var i = 0; i < milestones.length; i ++){
          locks[milestones[i]] = false;
        }

        // Recalculate percentage marks
        var marks = calculateMarks(docHeight, milestones);

        // Timing
        timing = +new Date - startTime;

      // If all marks already hit, unbind scroll event
      if (cache.length >= 4 + options.elements.length) {
        $window.off('scroll.scrollDepth');
        return;
      }

      // Check specified DOM elements
      if (options.elements) {
        checkElements(options.elements, scrollDistance, timing);
      }

      // Check standard marks
      if (options.percentage) {        
        locks = checkMarks(marks, scrollDistance, timing, locks);
      }
    }, 500));

  };

})( jQuery, window, document );
