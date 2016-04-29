import Ember from 'ember';
import { module, test } from 'qunit';
import computedStrict from 'tahi/lib/computed-strict';

module('computed-strict');


test('It can get using the provided functions', function(assert) {
  var TestClass = Ember.Object.extend({
    property: 'it is hi',
    propertyAlias: computedStrict('property', function(hi) {
      return hi();
    })
  });

  var testObj = TestClass.create({});

  assert.equal(testObj.get('propertyAlias'), 'it is hi');
});

test('It can not get using this.get', function(assert) {
  var TestClass = Ember.Object.extend({
    property: 'it is hi',
    propertyAlias: computedStrict(function() {
      return this.get('property');
    })
  });

  var testObj = TestClass.create({});

  assert.throws(function() {
    testObj.get('propertyAlias');
  },
  /You may not use 'this.get' in a strict computed property/,
  'raises an error');
});

test('It can do @each dependencies', function(assert) {
  var TestClass = Ember.Object.extend({
    many: [
      { foo: 1 },
      { foo: 2 },
      { foo: 3 },
      { foo: 4 },
      { foo: 5 }
    ],

    fourthFoo: computedStrict('many.@each.foo', function(foos) {
      return foos()[3];
    })
  });

  var testObj = TestClass.create({});

  assert.equal(testObj.get('fourthFoo'), 4, 'it maps within the each');
});

test('It can do [] dependencies', function(assert) {
  var TestClass = Ember.Object.extend({
    many: [
      { foo: 1 },
      { foo: 2 },
      { foo: 3 },
      { foo: 4 },
      { foo: 5 }
    ],

    fourthMany: computedStrict('many.[]', function(foos) {
      return foos()[3];
    })
  });

  var testObj = TestClass.create({});

  assert.equal(testObj.get('fourthMany').foo, 4, 'it returns the array');
});

test('It can prevent sub-gets', function(assert) {
  var TestClass = Ember.Object.extend({
    compoundValue: Ember.Object.create({
      subvalue: 'success!'
    }),

    failSubGetter: computedStrict('compoundValue', function(val) {
      return val().get('subvalue');
    })
  });

  var testObj = TestClass.create({});

  assert.throws(function() {
    testObj.get('failSubGetter');
  },
  /You may not use 'this.get' in a strict computed property/,
  'raises an error');
});

test('It can prevent sub-gets', function(assert) {
  var TestClass = Ember.Object.extend({
    compoundValue: Ember.Object.create({
      subvalue: 'success!'
    }),

    subGetter: computedStrict('compoundValue.subvalue', function(subval) {
      return subval();
    })
  });

  var testObj = TestClass.create({});

  assert.equal(testObj.get('subGetter'), 'success!', 'it returns the subvalue');
});
