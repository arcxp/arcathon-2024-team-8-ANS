/*global describe:true it:true */

var should = require('should'),
    dir = require('node-dir'),
    path = require('path'),
    Ajv = require('ajv'),
    ans = require('../lib/ans');

var loadedFiles = {};
var baseDir = path.join(path.dirname(module.filename), '../src/main/resources/schema/ans');
var loadedSchemas = {};

var ajv = new Ajv({allErrors:true});
//var tv4 = require('tv4');

var test_versions = [ "v0_4" ];

var json_schema = {
    "id": "http://json-schema.org/draft-04/schema#",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "description": "Core schema meta-schema",
    "definitions": {
        "schemaArray": {
            "type": "array",
            "minItems": 1,
            "items": { "$ref": "#" }
        },
        "positiveInteger": {
            "type": "integer",
            "minimum": 0
        },
        "positiveIntegerDefault0": {
            "allOf": [ { "$ref": "#/definitions/positiveInteger" }, { "default": 0 } ]
        },
        "simpleTypes": {
            "enum": [ "array", "boolean", "integer", "null", "number", "object", "string" ]
        },
        "stringArray": {
            "type": "array",
            "items": { "type": "string" },
            "minItems": 1,
            "uniqueItems": true
        }
    },
    "type": "object",
    "properties": {
        "id": {
            "type": "string",
            "format": "uri"
        },
        "$schema": {
            "type": "string",
            "format": "uri"
        },
        "title": {
            "type": "string"
        },
        "description": {
            "type": "string"
        },
        "default": {},
        "multipleOf": {
            "type": "number",
            "minimum": 0,
            "exclusiveMinimum": true
        },
        "maximum": {
            "type": "number"
        },
        "exclusiveMaximum": {
            "type": "boolean",
            "default": false
        },
        "minimum": {
            "type": "number"
        },
        "exclusiveMinimum": {
            "type": "boolean",
            "default": false
        },
        "maxLength": { "$ref": "#/definitions/positiveInteger" },
        "minLength": { "$ref": "#/definitions/positiveIntegerDefault0" },
        "pattern": {
            "type": "string",
            "format": "regex"
        },
        "additionalItems": {
            "anyOf": [
                { "type": "boolean" },
                { "$ref": "#" }
            ],
            "default": {}
        },
        "items": {
            "anyOf": [
                { "$ref": "#" },
                { "$ref": "#/definitions/schemaArray" }
            ],
            "default": {}
        },
        "maxItems": { "$ref": "#/definitions/positiveInteger" },
        "minItems": { "$ref": "#/definitions/positiveIntegerDefault0" },
        "uniqueItems": {
            "type": "boolean",
            "default": false
        },
        "maxProperties": { "$ref": "#/definitions/positiveInteger" },
        "minProperties": { "$ref": "#/definitions/positiveIntegerDefault0" },
        "required": { "$ref": "#/definitions/stringArray" },
        "additionalProperties": {
            "anyOf": [
                { "type": "boolean" },
                { "$ref": "#" }
            ],
            "default": {}
        },
        "definitions": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "properties": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "patternProperties": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
        },
        "dependencies": {
            "type": "object",
            "additionalProperties": {
                "anyOf": [
                    { "$ref": "#" },
                    { "$ref": "#/definitions/stringArray" }
                ]
            }
        },
        "enum": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true
        },
        "type": {
            "anyOf": [
                { "$ref": "#/definitions/simpleTypes" },
                {
                    "type": "array",
                    "items": { "$ref": "#/definitions/simpleTypes" },
                    "minItems": 1,
                    "uniqueItems": true
                }
            ]
        },
        "allOf": { "$ref": "#/definitions/schemaArray" },
        "anyOf": { "$ref": "#/definitions/schemaArray" },
        "oneOf": { "$ref": "#/definitions/schemaArray" },
        "not": { "$ref": "#" }
    },
    "dependencies": {
        "exclusiveMaximum": [ "maximum" ],
        "exclusiveMinimum": [ "minimum" ]
    },
    "default": {}
};

var hyper_schema = {
    "$schema": "http://json-schema.org/draft-04/hyper-schema#",
    "id": "http://json-schema.org/draft-04/hyper-schema#",
    "title": "JSON Hyper-Schema",
    "allOf": [
        {
            "$ref": "http://json-schema.org/draft-04/schema#"
        }
    ],
    "properties": {
        "additionalItems": {
            "anyOf": [
                {
                    "type": "boolean"
                },
                {
                    "$ref": "#"
                }
            ]
        },
        "additionalProperties": {
            "anyOf": [
                {
                    "type": "boolean"
                },
                {
                    "$ref": "#"
                }
            ]
        },
        "dependencies": {
            "additionalProperties": {
                "anyOf": [
                    {
                        "$ref": "#"
                    },
                    {
                        "type": "array"
                    }
                ]
            }
        },
        "items": {
            "anyOf": [
                {
                    "$ref": "#"
                },
                {
                    "$ref": "#/definitions/schemaArray"
                }
            ]
        },
        "definitions": {
            "additionalProperties": {
                "$ref": "#"
            }
        },
        "patternProperties": {
            "additionalProperties": {
                "$ref": "#"
            }
        },
        "properties": {
            "additionalProperties": {
                "$ref": "#"
            }
        },
        "allOf": {
            "$ref": "#/definitions/schemaArray"
        },
        "anyOf": {
            "$ref": "#/definitions/schemaArray"
        },
        "oneOf": {
            "$ref": "#/definitions/schemaArray"
        },
        "not": {
            "$ref": "#"
        },

        "links": {
            "type": "array",
            "items": {
                "$ref": "#/definitions/linkDescription"
            }
        },
        "fragmentResolution": {
            "type": "string"
        },
        "media": {
            "type": "object",
            "properties": {
                "type": {
                    "description": "A media type, as described in RFC 2046",
                    "type": "string"
                },
                "binaryEncoding": {
                    "description": "A content encoding scheme, as described in RFC 2045",
                    "type": "string"
                }
            }
        },
        "pathStart": {
            "description": "Instances' URIs must start with this value for this schema to apply to them",
            "type": "string",
            "format": "uri"
        }
    },
    "definitions": {
        "schemaArray": {
            "type": "array",
            "items": {
                "$ref": "#"
            }
        },
        "linkDescription": {
            "title": "Link Description Object",
            "type": "object",
            "required": [ "href", "rel" ],
            "properties": {
                "href": {
                    "description": "a URI template, as defined by RFC 6570, with the addition of the $, ( and ) characters for pre-processing",
                    "type": "string"
                },
                "rel": {
                    "description": "relation to the target resource of the link",
                    "type": "string"
                },
                "title": {
                    "description": "a title for the link",
                    "type": "string"
                },
                "targetSchema": {
                    "description": "JSON Schema describing the link target",
                    "$ref": "#"
                },
                "mediaType": {
                    "description": "media type (as defined by RFC 2046) describing the link target",
                    "type": "string"
                },
                "method": {
                    "description": "method for requesting the target of the link (e.g. for HTTP this might be \"GET\" or \"DELETE\")",
                    "type": "string"
                },
                "encType": {
                    "description": "The media type in which to submit data along with the request",
                    "type": "string",
                    "default": "application/json"
                },
                "schema": {
                    "description": "Schema describing the data to submit along with the request",
                    "$ref": "#"
                }
            }
        }
    },
    "links": [
        {
            "rel": "self",
            "href": "{+id}"
        },
        {
            "rel": "full",
            "href": "{+($ref)}"
        }
    ]
};


describe("ANS Schema", function() {
  beforeEach(function(done) {
    ans.getSchemas(function(err, schemas) {
      loadedSchemas = schemas;
      done();
    });
  });
  describe("All schemas can be loaded as JSON Schema", function() {
    it("should load all schemas into an object", function(done) {

      dir.readFiles(
        baseDir, {
          match:  /.json$/
        },
        function(err, content, filename, next) {
          if (err) throw err;
          var name = path.relative(baseDir, filename);
          loadedFiles[name] = content;
          next();
        },
        function(err, files) {
          if (err) {
            console.log(err);
            throw err;
          }

          var keys = Object.keys(loadedFiles);
          for ( var i = 0; i < keys.length; i++) {

            var schema = loadedSchemas[keys[i]];
            schema.should.be.instanceOf(Object);
            schema.should.deepEqual(JSON.parse(loadedFiles[keys[i]]));
          }
          done();
        }
      );
    });

    it("should validate as valid JSON Schema and Hyper Schema", function() {
      var keys = Object.keys(loadedSchemas);
      //tv4.addSchema(json_schema);
      //tv4.addSchema(hyper_schema);
      for( var i = 0; i < keys.length; i++) {
        console.log("        " + keys[i] + " should be a valid JSON Schema");
        var schema = loadedSchemas[keys[i]];
        ajv.addSchema(schema);
        //tv4.addSchema(schema);
      }
    });
  });
});



var fixtures = {};
var validate = function(version, schemaName, fixtureName, expected) {

  var schema = loadedSchemas[version + schemaName];
  var fixture = fixtures[fixtureName];

  expected = (typeof expected === "undefined") ? true : expected;

  var result = ajv.validate(schema, fixture);
  if (result !== expected) {
    console.log(ajv.errors);
  }

  // var result = tv4.validateResult(fixture, schema, false, true);
  // // console.log(result);
  // // console.log(result.valid);
  // // console.log(expected);
  // // console.log(result.valid == expected);
  // if (result.valid != expected) {
  //   console.log(result);
  // }

  result.should.eql(expected);

};





describe("Schema: ", function() {

  test_versions.forEach(function(version) {

    describe("ANS " + version, function() {

      before(function(done) {
        fixtures = {};
        dir.readFiles(
          path.join(path.dirname(module.filename), 'fixtures/schema/' + version),
          function(err, content, filename, next) {
            if (err) throw err;

            fixtures[path.basename(filename, '.json')] = JSON.parse(content);
            next();
          },
          function(err, files) {
            if (err) throw err;
            done();
          }
        );
      });


      describe("Address", function() {
        it("should validate a well-formatted address", function() {
          validate(version, '/address.json', 'address-fixture-good');
        });

        it("should not validate an address with a po box and no street address", function() {
          validate(version, '/address.json', 'address-fixture-bad-po-box', false);
        });
      });

      describe("Audio", function() {
        it("should validate a well-formatted audio", function() {
          validate(version, '/audio.json', 'audio-fixture-good');
        });

        it("should validate a well-formatted audio with settings", function() {
          validate(version, '/audio.json', 'audio-fixture-good-settings');
        });

        it("should validate a well-formatted audio with custom fields", function() {
          validate(version, '/audio.json', 'audio-fixture-good-custom');
        });

        it("should not validate a non-audio element", function() {
          validate(version, '/audio.json', 'audio-fixture-bad', false);
        });
      });

      describe("Video", function() {
        it("should validate a well-formatted video", function() {
          validate(version, '/video.json', 'video-fixture-good');
          validate(version, '/video.json', 'video-fixture-nationals');
        });

        it("should not validate a non-well-formatted video", function() {
          validate(version, '/video.json', 'video-fixture-bad', false);
        });
      });

      describe("Social", function() {
        it("should validate a social item", function() {
          validate(version, '/social.json', 'social-fixture-good');
        });
      });

      describe("Story", function() {
        it("should validate a story", function() {
          validate(version, '/story.json', 'story-fixture-good');
          validate(version, '/story.json', 'story-fixture-tiny-house');
          validate(version, '/story.json', 'story-fixture-references');
        });

      });

      describe("Image", function() {
        it("should validate a valid image", function() {
          validate(version, '/image.json', 'image-fixture-good');
        });
        it("should validate an image with no height or width", function() {
          validate(version, '/image.json', 'image-fixture-good-no-height-width');
        });
      });

      describe("Story Operation", function() {
        var type = "/story_operation.json";
        if (version === "v0_4") {
          type = "/story-operation.json";
        }

        it("should validate a create operation", function() {
          validate(version, type, 'operation-create');
        });
        it("should validate an update operation", function() {
          validate(version, type, 'operation-update');
        });
        it("should validate a delete operation", function() {
          validate(version, type, 'operation-delete');
        });
        it("should validate a publish-edition operation", function() {
          validate(version, type, 'operation-publish-edition');
        });
        it("should validate an unpublish-edition operation", function() {
          validate(version, type, 'operation-unpublish-edition');
        });
      });

      describe("Story Elements ", function() {
        var type_prefix = "/story_elements";
        if (version === "v0_4") {
          type_prefix = "/story-elements";
        }

        describe("Blockquote", function() {
          it("should validate a well-formatted blockquote", function() {
            validate(version, type_prefix + '/blockquote.json', 'bq-fixture-good');
          });

          it("should not validate a non-blockquote", function() {
            validate(version, type_prefix + '/blockquote.json', 'bq-fixture-bad', false);
          });
        });

        describe("Code", function() {
          it("should validate a well-formatted code sample", function() {
            validate(version, type_prefix + '/code.json', 'code-fixture-good');
          });
        });

        describe("List", function() {
          it("should validate a list of text elements", function() {
            validate(version, type_prefix + '/list.json', 'ul-fixture-good');
            validate(version, type_prefix + '/list-element.json', 'ul-fixture-good');
          });

          it("should validate a nested list of text elements", function() {
            validate(version, type_prefix + '/list.json', 'ul-fixture-good-nested');
          });
        });

        describe("Oembed", function() {
          it("should validate an oembed element", function() {
            validate(version, type_prefix + '/oembed.json', 'oembed-fixture-good');
          });

          it("should not validate a non-oembed", function() {
            validate(version, type_prefix + '/oembed.json', 'oembed-fixture-bad', false);
          });
        });


        describe("Text", function() {
          it("should validate a text element", function() {
            validate(version, type_prefix + '/text.json', 'text-fixture-good');
          });

          it("should validate a text element with channels", function() {
            validate(version, type_prefix + '/text.json', 'text-fixture-good-channels');
          });

          it("should not validate a non-text", function() {
            validate(version, type_prefix + '/text.json', 'text-fixture-bad', false);
          });
        });

        describe("Raw Html", function() {
          it("should validate a raw_html element", function() {
            validate(version, type_prefix + '/raw-html.json', 'raw-html-fixture-good');
          });

          it("should not validate a non-raw_html", function() {
            validate(version, type_prefix + '/raw-html.json', 'raw-html-fixture-bad', false);
          });
        });

        describe("Table", function() {
          it("should validate a table element", function() {
            validate(version, type_prefix + '/table.json', 'table-fixture-good');
          });

          it("should not validate a non-table", function() {
            validate(version, type_prefix + '/table.json', 'raw-html-fixture-bad', false);
          });
        });
      });
    });
  });
});
