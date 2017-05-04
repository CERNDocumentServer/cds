/*
 * This file is part of Invenio.
 * Copyright (C) 2016, 2017 CERN.
 *
 * Invenio is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of the
 * License, or (at your option) any later version.
 *
 * Invenio is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Invenio; if not, write to the Free Software Foundation, Inc.,
 * 59 Temple Place, Suite 330, Boston, MA 02111-1307, USA.

* In applying this license, CERN does not
* waive the privileges and immunities granted to it by virtue of its status
* as an Intergovernmental Organization or submit itself to any jurisdiction.
*/

var app = angular.module('cds', ['ngclipboard']);
app.filter('previewIframe', ['$sce', '$window', function($sce, $window) {
  return function(text, reportNumber, external) {
    var _url = '/video/' + reportNumber;
    if (external) {
      _url = $window.location.origin + _url;
    }
    var iframe = _.template(
      '<iframe src="<%= src %>" width="560" height="315"' +
      ' frameborder="0" allowfullscreen></iframe>'
    );
    return iframe({
      src: $sce.trustAsResourceUrl(_url)
    });
  };
}]);
app.directive('errSrc', function() {
  // Replace 404 images with an error
  return {
    link: function(scope, element, attrs) {
      element.bind('error', function() {
        if (attrs.src != attrs.errSrc) {
          attrs.$set('src', attrs.errSrc);
        }
      });
    }
  }
});
app.filter('previewIframeSrc', ['$sce', '$window', function($sce, $window) {
  return function(text, id, key, external) {

    var _url = '/record/' + id + '/preview/' + key;
    if (external) {
      _url = $window.location.origin + _url;
    }
    return $sce.trustAsResourceUrl(_url)
  };
}]);
app.filter('toInt', function() {
  return function(text) {
    return text ? parseInt(text) : text;
  }
});
app.filter('stripTags', function() {
  return function(text) {
    return text ? String(text).replace(/<[^>]+>/gm, '') : '';
  }
});
app.filter('toMinutes', function() {
  return function(seconds) {
    try {
      return new Date(seconds * 1000).toISOString().substr(11, 8);
    } catch(error) {
      return seconds
    }
  }
});

// Find master video file in record's files
app.filter('findMaster', function() {
  return function(record) {
    if (!_.isEmpty(record)) {
      var _files = record.metadata ? record.metadata._files : record._files;
      return _.find(_files, function (file) {
          return file.context_type === 'master';
      })
    }
  }
});

// Find first frame of master video file
app.filter('findPoster', function() {
  return function(masterFile) {
    return _.find(masterFile['frame'], function (frame) {
        return frame.key === 'frame-1.jpg'
    })
  }
});

// Find gif animation of master video file's frames
app.filter('findGif', function() {
  return function(masterFile) {
    return _.find(masterFile['frames-preview'], function (gif) {
        return gif.key === 'frames.gif'
    })
  }
});

// Get FlaskIIIF resize link
app.filter('iiif', function($filter) {
  return function(record, showGif, size) {
    var masterFile = $filter('findMaster')(record);
    var _deposit = record.metadata ? record.metadata._buckets.deposit : record._buckets.deposit;
    return _.template(
      "/api/iiif/v2/<%=deposit%>:<%=key%>/full/<%=size%>/0/default.<%=ext%>"
    )({
      deposit: _deposit,
      key: ($filter(showGif ? 'findGif' : 'findPoster')(masterFile)).key,
      size: size.join(','),
      ext: showGif ? 'gif' : 'png',
    });
  }
});

// Trust as html
app.filter('trustHtml', ['$sce', function($sce) {
  return function(text) {
    return $sce.trustAsHtml(text);
  };
}]);
