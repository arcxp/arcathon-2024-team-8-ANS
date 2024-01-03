'use strict';

var _ = require('lodash');
var current_version = require('../version');
var transform_utils = require('../transform_utils');

var version_incrementer = transform_utils.version_incrementer;
var top_level_types = transform_utils.top_level_types;
var recursion_keys = transform_utils.recursion_keys;
var accumulatorFor = transform_utils.accumulatorFor;
var limitFields = transform_utils.limitFields;
var cleanFieldNames = transform_utils.cleanFieldNames;

// Corrections underwent breaking changes
var convertCorrection = function convertCorrection(old_correction) {
  // Corrections move from open to closed. We will leave any of either the new or old properties in place and move the rest to additional_properties
  var correction = limitFields(['type', '_id', 'subtype', 'channels', 'alignment', 'additional_properties', 'correction_type', 'text'],
                               old_correction);


  // This was intended to move .corrections.text to .corrections.content.  We are backing that change out to maintain backwards compatibility.
  //
  // if (_.has(correction, 'text') && !_.isNil(correction.text)) {
  //   if(_.has(correction, 'content')) {
  //     if (!_.has(correction, 'additional_properties') || !_.isObject(correction.additional_properties)) {
  //       correction.additional_properties = {};
  //     }
  //     correction.additional_properties.content = correction.content;
  //   }

  //   correction.content = correction.text;
  // }

  if (!_.has(correction, 'text') || !_.isString(correction.text)) {
    correction.text = "";
  }

  correction.type = 'correction';

  //delete correction.text;

  return correction;
};

// Tags in 0.5.7 were mostly undefined object. In 0.5.8 they have specified properties. Fields which
// match the new properties should be preserved, those that do not should be moved into additional_properties.
var convertTag = function convertTag(old_tag) {

  var additional_properties = _.has(old_tag, 'additional_properties') && _.isObject(old_tag.additional_properties) ?
      _.cloneDeep(old_tag.additional_properties) : {};

  var tag = _.transform(old_tag, function(result, value, key, object) {
    // Specced Tag fields for 0.5.8
    if (_.includes(['_id', 'text', 'description', 'slug'], key)) {
      result[key] = value;
    }
    else {
      // Example: .foo should become .additional_properties.foo
      // In the unlikely even that .additional_properties.foo already existed on the old object,
      // then this will overwrite it (but it will show up as .additional_properties.additional_properties.foo)
      additional_properties[key] = value;
      // 'tag' was in use in some places in lieu of text, so copy over if possible
      if (key === 'tag' && !_.has(object, 'text')) {
        result['text'] = value;
      }
    }
  }, {});

  if (_.size(additional_properties) > 0) {
    tag.additional_properties = additional_properties;
  }

  return tag;
};


// In 0.5.8, "related_content.redirect" is a reserved key. It was not largely in use before, so we'll just delete.
var convertRelatedContent = function convertRelatedContent(old_related_content) {

  // Related Content is a recursion point, so first convert children
  old_related_content = convert(old_related_content);

  // Delete on the way out.
  if (_.has(old_related_content, 'redirect')) {
    delete old_related_content.redirect;
  }

  return old_related_content;
};



// Move label from undefined object to new format
var convertLabel = function convertLabel(old_label) {

  // Force each label to have correct keys.
  var label = _.transform(old_label, function(result, value, key, object) {

    if (key !== 'additional_properties') {
      var label_item = limitFields(['text', 'url', 'display', 'additional_properties'], value);
      if (!_.has(label_item, 'text')) {
        label_item.text = '';
      }

      result[key] = label_item;
    }
    else {
      result[key] = value;
    }
  }, {});

  if (!_.has(label, 'basic')) {
    label.basic = {
      'text': ''
    };
  }

  // Rename invalid keys to valid names.
  return cleanFieldNames(label);

};

// Move source from undefined object to new format
var convertSource = function convertSource(old_source) {
  var source = limitFields(['source_id', 'source_type', 'name', 'system', 'edit_url', 'additional_properties'], old_source);
  return source;
};


// Move comments from undefined object to new format
var convertComments = function convertComments(old_comments) {
  var comments = limitFields(['comments_period', 'allow_comments', 'display_comments', 'moderation_required',
                              'additional_properties'], old_comments);
  return comments;
};


// Generate a workflow object from old additional properties
var workflowFromPlanning = function workflowFromPlanning(old_planning) {

  var workflow = {};
  var modified = false;
  if (_.has(old_planning, 'additional_properties.status.workflow')) {
    var old_status = _.get(old_planning, 'additional_properties.status.workflow');
    if (_.toInteger(old_status) >= 1) {
      workflow.status_code = _.toInteger(old_status);
      modified = true;
    }
  }
  if (_.has(old_planning, 'additional_properties.status.note')) {
    workflow.note = '' + _.get(old_planning, 'additional_properties.status.note');
    modified = true;
  }

  if (modified) {
    return workflow;
  }
  else {
    return null;
  }

}

// Convert a top-level ANS document and recur at known points
var convertDocument = function convertDocument(doc) {
  return _.transform(doc, function(result, value, key, object) {
    if (key === 'taxonomy') {
      var taxonomy = {};
      _.assign(taxonomy, value, { 'tags': _.map(value.tags, convertTag) });
      result[key] = taxonomy;
    }
    else if (key === 'label') {
      result[key] = convertLabel(value);
    }
    else if (key === 'source') {
      result[key] = convertSource(value);
    }
    else if (key === 'comments') {
      result[key] = convertComments(value);
    }
    else if (key === 'related_content') {
      result[key] = convertRelatedContent(value);
    }
    else if (key === 'corrections') {
      result[key] = _.map(value, convertCorrection);
    }
    else if (key === 'planning') {
      result[key] = convert(value);
      var workflow = workflowFromPlanning(value);
      if (!_.isNil(workflow)) {
        result.workflow = workflow;
      }
    }

    else if (_.includes(recursion_keys, key)) {
      result[key] = convert(value);
    }
  }, doc);
};

// Generic recur-and-convert down object tree
var convert = function convert(ans) {
  if (!_.isObject(ans)) {
    return ans;
  }

  if (_.isArray(ans)) {
    return _.map(ans, convert);
  }

  if (_.has(ans, 'type')) {
    if (_.includes(top_level_types, ans.type)) {
      return convertDocument(ans);
    }
    // Note: instead of changing tables, we are making them table_02
    // else if (ans.type === 'table') {
    //   return convertTable(ans);
    // }
  }

  return _.transform(ans, function(result, value, key, object) {
    if (key === 'additional_properties' || key === 'referent_properties') {
      result[key] = value;
    }
    else {
      result[key] = convert(value);
    }
  }, accumulatorFor(ans));
};


var upvert = function(input) {
  var output = version_incrementer('0.5.8')(input);

  return convertDocument(output);
};

module.exports = upvert;
