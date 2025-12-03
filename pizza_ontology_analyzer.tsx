import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, FileText } from 'lucide-react';

const PizzaOntologyAnalyzer = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  const parseOWL = (fileContent) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(fileContent, 'text/xml');
      
      const parserError = xmlDoc.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        console.error('XML parsing error');
        setLoading(false);
        return;
      }
      
      const declarations = Array.from(xmlDoc.getElementsByTagName('Declaration'));
      const classDeclarations = declarations.filter(decl => 
        decl.getElementsByTagName('Class').length > 0
      );
      
      const subClassOfs = Array.from(xmlDoc.getElementsByTagName('SubClassOf'));
      const equivalentClasses = Array.from(xmlDoc.getElementsByTagName('EquivalentClasses'));
      const disjointClasses = Array.from(xmlDoc.getElementsByTagName('DisjointClasses'));
      
      const classes = [];
      const classNames = new Set();
      
      for (const decl of classDeclarations) {
        const classElem = decl.getElementsByTagName('Class')[0];
        if (!classElem) continue;
        
        const iri = classElem.getAttribute('IRI') || classElem.getAttribute('abbreviatedIRI');
        if (!iri) continue;
        
        const className = iri.replace('#', '').replace(':', '_');
        if (classNames.has(className)) continue;
        classNames.add(className);
        
        const hasSubClassOf = subClassOfs.some(sc => {
          const classes = sc.getElementsByTagName('Class');
          return Array.from(classes).some(c => {
            const cIri = c.getAttribute('IRI') || c.getAttribute('abbreviatedIRI');
            return cIri && cIri.replace('#', '').replace(':', '_') === className;
          });
        });
        
        const hasEquivalent = equivalentClasses.some(ec => {
          const classes = ec.getElementsByTagName('Class');
          return Array.from(classes).some(c => {
            const cIri = c.getAttribute('IRI') || c.getAttribute('abbreviatedIRI');
            return cIri && cIri.replace('#', '').replace(':', '_') === className;
          });
        });
        
        const hasDisjoint = disjointClasses.some(dc => {
          const classes = dc.getElementsByTagName('Class');
          return Array.from(classes).some(c => {
            const cIri = c.getAttribute('IRI') || c.getAttribute('abbreviatedIRI');
            return cIri && cIri.replace('#', '').replace(':', '_') === className;
          });
        });
        
        let details = [];
        let restrictions = 0;
        
        const relevantSubClassOfs = subClassOfs.filter(sc => {
          const firstClass = sc.getElementsByTagName('Class')[0];
          if (!firstClass) return false;
          const cIri = firstClass.getAttribute('IRI') || firstClass.getAttribute('abbreviatedIRI');
          return cIri && cIri.replace('#', '').replace(':', '_') === className;
        });
        
        for (const sc of relevantSubClassOfs) {
          const allClasses = sc.getElementsByTagName('Class');
          if (allClasses.length > 1) {
            const parentIri = allClasses[1].getAttribute('IRI') || allClasses[1].getAttribute('abbreviatedIRI');
            if (parentIri) {
              details.push(parentIri.replace('#', '').replace(':', '_'));
            }
          }
          
          const objectRestrictions = [
            ...Array.from(sc.getElementsByTagName('ObjectSomeValuesFrom')),
            ...Array.from(sc.getElementsByTagName('ObjectAllValuesFrom')),
            ...Array.from(sc.getElementsByTagName('ObjectHasValue')),
            ...Array.from(sc.getElementsByTagName('ObjectMinCardinality')),
            ...Array.from(sc.getElementsByTagName('ObjectMaxCardinality'))
          ];
          restrictions += objectRestrictions.length;
        }
        
        const relevantEquivalents = equivalentClasses.filter(ec => {
          const firstClass = ec.getElementsByTagName('Class')[0];
          if (!firstClass) return false;
          const cIri = firstClass.getAttribute('IRI') || firstClass.getAttribute('abbreviatedIRI');
          return cIri && cIri.replace('#', '').replace(':', '_') === className;
        });
        
        for (const ec of relevantEquivalents) {
          const intersections = ec.getElementsByTagName('ObjectIntersectionOf');
          const unions = ec.getElementsByTagName('ObjectUnionOf');
          const oneOfs = ec.getElementsByTagName('ObjectOneOf');
          restrictions += intersections.length + unions.length + oneOfs.length;
        }
        
        const hasDefinition = hasSubClassOf || hasEquivalent || hasDisjoint;
        
        classes.push({
          name: className,
          hasDefinition: hasDefinition,
          subClassOf: details,
          restrictions: restrictions,
          hasEquivalent: hasEquivalent,
          hasDisjoint: hasDisjoint
        });
      }
      
      classes.sort((a, b) => a.name.localeCompare(b.name));
      
      const definedClasses = classes.filter(c => c.hasDefinition);
      const undefinedClasses = classes.filter(c => !c.hasDefinition);
      const coverage = classes.length > 0 ? (definedClasses.length / classes.length * 100).toFixed(1) : 0;
      
      setAnalysis({
        totalClasses: classes.length,
        definedClasses: definedClasses,
        undefinedClasses: undefinedClasses,
        coverage: coverage
      });
      
    } catch (error) {
      console.error('Error parsing OWL:', error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    const embeddedOWL = '<?xml version="1.0"?><Ontology xmlns="http://www.w3.org/2002/07/owl#" xml:base="http://www.semanticweb.org/heinz/ontologies/2025/12/pizza" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:xml="http://www.w3.org/XML/1998/namespace" xmlns:xsd="http://www.w3.org/2001/XMLSchema#" xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#" ontologyIRI="http://www.semanticweb.org/heinz/ontologies/2025/12/pizza"><Declaration><Class IRI="#AnchovyTopping"/></Declaration><Declaration><Class IRI="#CaperTopping"/></Declaration><Declaration><Class IRI="#CheeseTopping"/></Declaration><Declaration><Class IRI="#DeepPanBase"/></Declaration><Declaration><Class IRI="#GreenPepperTopping"/></Declaration><Declaration><Class IRI="#HamTopping"/></Declaration><Declaration><Class IRI="#InterestingPizza"/></Declaration><Declaration><Class IRI="#JalapenoPepperTopping"/></Declaration><Declaration><Class IRI="#MargheritaPizza"/></Declaration><Declaration><Class IRI="#MeatPizza"/></Declaration><Declaration><Class IRI="#MeatTopping"/></Declaration><Declaration><Class IRI="#MozzarellaTopping"/></Declaration><Declaration><Class IRI="#MushroomTopping"/></Declaration><Declaration><Class IRI="#NamedPizza"/></Declaration><Declaration><Class IRI="#OliveTopping"/></Declaration><Declaration><Class IRI="#ParmesanTopping"/></Declaration><Declaration><Class IRI="#PepperTopping"/></Declaration><Declaration><Class IRI="#PepperoniTopping"/></Declaration><Declaration><Class IRI="#Pizza"/></Declaration><Declaration><Class IRI="#PizzaBase"/></Declaration><Declaration><Class IRI="#PizzaTopping"/></Declaration><Declaration><Class IRI="#PrawnTopping"/></Declaration><Declaration><Class IRI="#RedPepperTopping"/></Declaration><Declaration><Class IRI="#SalamiTopping"/></Declaration><Declaration><Class IRI="#SeafoodTopping"/></Declaration><Declaration><Class IRI="#Spiciness"/></Declaration><Declaration><Class IRI="#SpicyBeefTopping"/></Declaration><Declaration><Class IRI="#SpicyPizza"/></Declaration><Declaration><Class IRI="#ThinAndCrispyBase"/></Declaration><Declaration><Class IRI="#TomatoTopping"/></Declaration><Declaration><Class IRI="#TunaTopping"/></Declaration><Declaration><Class IRI="#VegetableTopping"/></Declaration><Declaration><Class IRI="#VegetarianPizza"/></Declaration><Declaration><Class IRI="#olivePizza"/></Declaration><Declaration><Class IRI="#pepperoniPizza"/></Declaration><Declaration><Class IRI="#pizzaLotsOfCalorie"/></Declaration><Declaration><Class IRI="#pizzaLowCalorie"/></Declaration><Declaration><Class IRI="#pizzaThatHasCheese"/></Declaration><Declaration><Class IRI="#spicyPepperoniPizza"/></Declaration><EquivalentClasses><Class IRI="#InterestingPizza"/><ObjectIntersectionOf><Class IRI="#Pizza"/><ObjectMinCardinality cardinality="3"><ObjectProperty IRI="#hasTopping"/><Class IRI="#PizzaTopping"/></ObjectMinCardinality></ObjectIntersectionOf></EquivalentClasses><EquivalentClasses><Class IRI="#Spiciness"/><ObjectOneOf><NamedIndividual IRI="#Hot"/><NamedIndividual IRI="#Medium"/><NamedIndividual IRI="#Mild"/></ObjectOneOf></EquivalentClasses><EquivalentClasses><Class IRI="#SpicyPizza"/><ObjectIntersectionOf><Class IRI="#Pizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasTopping"/><ObjectHasValue><ObjectProperty IRI="#hasSpiciness"/><NamedIndividual IRI="#Hot"/></ObjectHasValue></ObjectSomeValuesFrom></ObjectIntersectionOf></EquivalentClasses><EquivalentClasses><Class IRI="#VegetarianPizza"/><ObjectIntersectionOf><Class IRI="#Pizza"/><ObjectAllValuesFrom><ObjectProperty IRI="#hasTopping"/><ObjectUnionOf><Class IRI="#CheeseTopping"/><Class IRI="#VegetableTopping"/></ObjectUnionOf></ObjectAllValuesFrom></ObjectIntersectionOf></EquivalentClasses><EquivalentClasses><Class IRI="#pizzaLotsOfCalorie"/><ObjectIntersectionOf><Class IRI="#Pizza"/><DataSomeValuesFrom><DataProperty IRI="#hasCaloricContent"/><DatatypeRestriction><Datatype abbreviatedIRI="xsd:integer"/><FacetRestriction facet="http://www.w3.org/2001/XMLSchema#minInclusive"><Literal datatypeIRI="http://www.w3.org/2001/XMLSchema#integer">400</Literal></FacetRestriction></DatatypeRestriction></DataSomeValuesFrom></ObjectIntersectionOf></EquivalentClasses><EquivalentClasses><Class IRI="#pizzaLowCalorie"/><ObjectIntersectionOf><Class IRI="#Pizza"/><DataSomeValuesFrom><DataProperty IRI="#hasCaloricContent"/><DatatypeRestriction><Datatype abbreviatedIRI="xsd:integer"/><FacetRestriction facet="http://www.w3.org/2001/XMLSchema#maxExclusive"><Literal datatypeIRI="http://www.w3.org/2001/XMLSchema#integer">400</Literal></FacetRestriction></DatatypeRestriction></DataSomeValuesFrom></ObjectIntersectionOf></EquivalentClasses><EquivalentClasses><Class IRI="#pizzaThatHasCheese"/><ObjectIntersectionOf><Class IRI="#Pizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasTopping"/><Class IRI="#CheeseTopping"/></ObjectSomeValuesFrom></ObjectIntersectionOf></EquivalentClasses><SubClassOf><Class IRI="#AnchovyTopping"/><Class IRI="#SeafoodTopping"/></SubClassOf><SubClassOf><Class IRI="#CaperTopping"/><Class IRI="#VegetableTopping"/></SubClassOf><SubClassOf><Class IRI="#CheeseTopping"/><Class IRI="#PizzaTopping"/></SubClassOf><SubClassOf><Class IRI="#DeepPanBase"/><Class IRI="#PizzaBase"/></SubClassOf><SubClassOf><Class IRI="#GreenPepperTopping"/><Class IRI="#PepperTopping"/></SubClassOf><SubClassOf><Class IRI="#HamTopping"/><Class IRI="#MeatTopping"/></SubClassOf><SubClassOf><Class IRI="#JalapenoPepperTopping"/><Class IRI="#PepperTopping"/></SubClassOf><SubClassOf><Class IRI="#JalapenoPepperTopping"/><ObjectHasValue><ObjectProperty IRI="#hasSpiciness"/><NamedIndividual IRI="#Hot"/></ObjectHasValue></SubClassOf><SubClassOf><Class IRI="#MargheritaPizza"/><Class IRI="#NamedPizza"/></SubClassOf><SubClassOf><Class IRI="#MargheritaPizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasTopping"/><Class IRI="#MozzarellaTopping"/></ObjectSomeValuesFrom></SubClassOf><SubClassOf><Class IRI="#MargheritaPizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasTopping"/><Class IRI="#TomatoTopping"/></ObjectSomeValuesFrom></SubClassOf><SubClassOf><Class IRI="#MargheritaPizza"/><ObjectAllValuesFrom><ObjectProperty IRI="#hasTopping"/><ObjectUnionOf><Class IRI="#MozzarellaTopping"/><Class IRI="#TomatoTopping"/></ObjectUnionOf></ObjectAllValuesFrom></SubClassOf><SubClassOf><Class IRI="#MeatPizza"/><Class IRI="#Pizza"/></SubClassOf><SubClassOf><Class IRI="#MeatTopping"/><Class IRI="#PizzaTopping"/></SubClassOf><SubClassOf><Class IRI="#MozzarellaTopping"/><Class IRI="#CheeseTopping"/></SubClassOf><SubClassOf><Class IRI="#MushroomTopping"/><Class IRI="#VegetableTopping"/></SubClassOf><SubClassOf><Class IRI="#NamedPizza"/><Class IRI="#Pizza"/></SubClassOf><SubClassOf><Class IRI="#OliveTopping"/><Class IRI="#VegetableTopping"/></SubClassOf><SubClassOf><Class IRI="#ParmesanTopping"/><Class IRI="#CheeseTopping"/></SubClassOf><SubClassOf><Class IRI="#PepperTopping"/><Class IRI="#VegetableTopping"/></SubClassOf><SubClassOf><Class IRI="#PepperoniTopping"/><Class IRI="#MeatTopping"/></SubClassOf><SubClassOf><Class IRI="#Pizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasBase"/><Class IRI="#PizzaBase"/></ObjectSomeValuesFrom></SubClassOf><SubClassOf><Class IRI="#Pizza"/><DataSomeValuesFrom><DataProperty IRI="#hasCaloricContent"/><Datatype abbreviatedIRI="xsd:integer"/></DataSomeValuesFrom></SubClassOf><SubClassOf><Class IRI="#PrawnTopping"/><Class IRI="#SeafoodTopping"/></SubClassOf><SubClassOf><Class IRI="#RedPepperTopping"/><Class IRI="#PepperTopping"/></SubClassOf><SubClassOf><Class IRI="#SalamiTopping"/><Class IRI="#MeatTopping"/></SubClassOf><SubClassOf><Class IRI="#SeafoodTopping"/><Class IRI="#PizzaTopping"/></SubClassOf><SubClassOf><Class IRI="#SpicyBeefTopping"/><Class IRI="#MeatTopping"/></SubClassOf><SubClassOf><Class IRI="#ThinAndCrispyBase"/><Class IRI="#PizzaBase"/></SubClassOf><SubClassOf><Class IRI="#TomatoTopping"/><Class IRI="#VegetableTopping"/></SubClassOf><SubClassOf><Class IRI="#TunaTopping"/><Class IRI="#SeafoodTopping"/></SubClassOf><SubClassOf><Class IRI="#VegetableTopping"/><Class IRI="#PizzaTopping"/></SubClassOf><SubClassOf><Class IRI="#olivePizza"/><Class IRI="#NamedPizza"/></SubClassOf><SubClassOf><Class IRI="#olivePizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasTopping"/><Class IRI="#MozzarellaTopping"/></ObjectSomeValuesFrom></SubClassOf><SubClassOf><Class IRI="#olivePizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasTopping"/><Class IRI="#OliveTopping"/></ObjectSomeValuesFrom></SubClassOf><SubClassOf><Class IRI="#olivePizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasTopping"/><Class IRI="#ParmesanTopping"/></ObjectSomeValuesFrom></SubClassOf><SubClassOf><Class IRI="#olivePizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasTopping"/><Class IRI="#TomatoTopping"/></ObjectSomeValuesFrom></SubClassOf><SubClassOf><Class IRI="#olivePizza"/><ObjectAllValuesFrom><ObjectProperty IRI="#hasTopping"/><ObjectUnionOf><Class IRI="#MozzarellaTopping"/><Class IRI="#OliveTopping"/><Class IRI="#ParmesanTopping"/><Class IRI="#TomatoTopping"/></ObjectUnionOf></ObjectAllValuesFrom></SubClassOf><SubClassOf><Class IRI="#pepperoniPizza"/><Class IRI="#NamedPizza"/></SubClassOf><SubClassOf><Class IRI="#pepperoniPizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasTopping"/><Class IRI="#MozzarellaTopping"/></ObjectSomeValuesFrom></SubClassOf><SubClassOf><Class IRI="#pepperoniPizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasTopping"/><Class IRI="#PepperoniTopping"/></ObjectSomeValuesFrom></SubClassOf><SubClassOf><Class IRI="#pepperoniPizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasTopping"/><Class IRI="#TomatoTopping"/></ObjectSomeValuesFrom></SubClassOf><SubClassOf><Class IRI="#spicyPepperoniPizza"/><Class IRI="#NamedPizza"/></SubClassOf><SubClassOf><Class IRI="#spicyPepperoniPizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasTopping"/><Class IRI="#JalapenoPepperTopping"/></ObjectSomeValuesFrom></SubClassOf><SubClassOf><Class IRI="#spicyPepperoniPizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasTopping"/><Class IRI="#MozzarellaTopping"/></ObjectSomeValuesFrom></SubClassOf><SubClassOf><Class IRI="#spicyPepperoniPizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasTopping"/><Class IRI="#PepperoniTopping"/></ObjectSomeValuesFrom></SubClassOf><SubClassOf><Class IRI="#spicyPepperoniPizza"/><ObjectSomeValuesFrom><ObjectProperty IRI="#hasTopping"/><Class IRI="#TomatoTopping"/></ObjectSomeValuesFrom></SubClassOf><DisjointClasses><Class IRI="#AnchovyTopping"/><Class IRI="#PrawnTopping"/><Class IRI="#TunaTopping"/></DisjointClasses><DisjointClasses><Class IRI="#CaperTopping"/><Class IRI="#MushroomTopping"/><Class IRI="#OliveTopping"/><Class IRI="#PepperTopping"/><Class IRI="#TomatoTopping"/></DisjointClasses><DisjointClasses><Class IRI="#CheeseTopping"/><Class IRI="#MeatTopping"/><Class IRI="#SeafoodTopping"/><Class IRI="#VegetableTopping"/></DisjointClasses><DisjointClasses><Class IRI="#DeepPanBase"/><Class IRI="#ThinAndCrispyBase"/></DisjointClasses><DisjointClasses><Class IRI="#GreenPepperTopping"/><Class IRI="#JalapenoPepperTopping"/><Class IRI="#RedPepperTopping"/></DisjointClasses><DisjointClasses><Class IRI="#HamTopping"/><Class IRI="#PepperoniTopping"/><Class IRI="#SalamiTopping"/><Class IRI="#SpicyBeefTopping"/></DisjointClasses><DisjointClasses><Class IRI="#MargheritaPizza"/><Class IRI="#olivePizza"/><Class IRI="#pepperoniPizza"/><Class IRI="#spicyPepperoniPizza"/></DisjointClasses><DisjointClasses><Class IRI="#MozzarellaTopping"/><Class IRI="#ParmesanTopping"/></DisjointClasses><DisjointClasses><Class IRI="#Pizza"/><Class IRI="#PizzaBase"/><Class IRI="#PizzaTopping"/></DisjointClasses></Ontology>';
    
    parseOWL(embeddedOWL);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="mt-6 text-lg text-gray-600 font-medium">Analyzing Pizza Ontology...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">Error loading ontology</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Pizza Ontology Coverage Analysis</h1>
          <p className="text-gray-600">Heinrick Janiola's Pizza Ontology - Class Definition Coverage Report</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Coverage Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-green-200 rounded-xl p-6 bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Defined Classes</h3>
                <span className="text-lg font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  {analysis.coverage}%
                </span>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-4">
                {analysis.definedClasses.length}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${analysis.coverage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-700">
                {analysis.definedClasses.length} of {analysis.totalClasses} classes have formal definitions
              </p>
            </div>

            <div className="border-2 border-orange-200 rounded-xl p-6 bg-gradient-to-br from-orange-50 to-amber-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Missing Definitions</h3>
                <span className="text-lg font-bold text-orange-700 bg-orange-100 px-3 py-1 rounded-full">
                  {(100 - analysis.coverage).toFixed(1)}%
                </span>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-4">
                {analysis.undefinedClasses.length}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${100 - analysis.coverage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-700">
                Classes that could benefit from additional axioms
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Defined Classes
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {analysis.definedClasses.map((cls, idx) => (
                <div key={idx} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all">
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{cls.name}</h3>
                  {cls.subClassOf.length > 0 && (
                    <div className="mb-2">
                      <span className="text-xs font-semibold text-gray-600 uppercase">Subclass of:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cls.subClassOf.map((parent, i) => (
                          <span key={i} className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {parent}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 text-sm text-gray-600">
                    {cls.restrictions > 0 && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {cls.restrictions} restriction{cls.restrictions !== 1 ? 's' : ''}
                      </span>
                    )}
                    {cls.hasEquivalent && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        Has equivalent class
                      </span>
                    )}
                    {cls.hasDisjoint && (
                      <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded">
                        Disjoint axioms
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {analysis.definedClasses.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="mx-auto h-12 w-12 mb-3" />
                  <p>No defined classes found</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              Missing Definitions
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {analysis.undefinedClasses.map((cls, idx) => (
                <div key={idx} className="border-2 border-orange-200 bg-orange-50 rounded-lg p-4 hover:border-orange-400 transition-all">
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{cls.name}</h3>
                  <p className="text-sm text-gray-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>No formal definition, subclass relationships, or axioms defined</span>
                  </p>
                </div>
              ))}
              {analysis.undefinedClasses.length === 0 && (
                <div className="text-center py-12 text-green-600">
                  <FileText className="mx-auto h-12 w-12 mb-3" />
                  <p className="font-semibold text-lg">Perfect Coverage!</p>
                  <p className="text-sm text-gray-600 mt-2">All classes have formal definitions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PizzaOntologyAnalyzer;