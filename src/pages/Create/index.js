import React, { useRef, useState, useEffect } from "react";
import { Form } from "@unform/web";
import { Scope } from "@unform/core";
import ReactSelect from "react-select";
import { FiTrash2 } from "react-icons/fi";

import Input from "../../components/Input";
import Select from "../../components/Select";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import api from "../../services/api";

import "./styles.css";

export default function Create() {
  const [type, setType] = useState("SoilProbe");
  const [newAttribute, setNewAttribute] = useState("");
  const [newRelationship, setNewRelationship] = useState("");
  const [entities, setEntities] = useState([]);
  const [numOfAttributes, setNumOfAttributes] = useState(0);
  const [attributes, setAttributes] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [selectedObject, setSelectedObject] = useState({
    value: "SoilProbe",
    acceptableEntities: [["ManagementZone", 1]],
    label: "SoilProbe",
  });

  async function loadEntities() {
    const { data } = await api.get("/v2/entities?limit=1000");

    setEntities(data);
    console.log(data);
  }

  useEffect(() => {
    loadEntities();
  }, []);

  // object types to be selected in the SelectBox
  const objectTypes = [
    {
      value: "SoilProbe",
      acceptableEntities: [["ManagementZone", 1]],
      label: "SoilProbe",
    },
    {
      value: "Farmer",
      acceptableEntities: [["Farm", -1]],
      label: "Farmer",
    },
    {
      value: "Farm",
      acceptableEntities: [
        ["Farmer", 1],
        ["ManagementZone", -1],
      ],
      label: "Farm",
    },
    {
      value: "ManagementZone",
      acceptableEntities: [
        ["Farm", 1],
        ["SoilProbe", -1],
      ],
      label: "ManagementZone",
    },
  ];

  // types that can be selected for each entity attribute
  const validTypes = [
    {
      value: "Number",
      label: "Number",
    },
    {
      value: "Text",
      label: "Text",
    },
  ];

  function reset() {
    setAttributes([]);
    setNewAttribute("");
    setNumOfAttributes(0);
    setRelationships([]);
    setNewRelationship("");
    loadEntities();
  }

  // create the entity and convert it to JSON file
  async function handleSubmit(entity) {
    const copyRelationships = relationships;
    let error = false;
    const { data } = await api.get(`/v2/entities?type=${type}&limit=100`);
    let newId;
    if (data.length !== 0) {
      let substring = data[data.length - 1].id.split(`urn:ngsi-ld:${type}:`);
      newId = parseInt(substring[1]) + 1;
      console.log(substring[1]);
    } else {
      newId = 1;
    }
    entity.id = `urn:ngsi-ld:${type}:${newId}`;

    if (copyRelationships.length !== 0) {
      relationships.map(async (relationship) => {
        // const copyRelationship = relationship;
        relationship[`ref${type}`] = {
          type: "Relationship",
          value: entity.id,
        };
        const id = relationship.id;
        delete relationship.id;
        delete relationship.type;
        await api.put(`v2/entities/${id}/attrs`, relationship);
      });
    }

    // send the new entity to ORION
    try {
      await api.post("/v2/entities", entity);
    } catch (e) {
      error = true;
      console.log(e);
    }
    if (error) {
      alert("It was not possible to create a new entity!");
    } else {
      alert("Entity created successfully!");
      reset();
    }
  }

  const addNewAttribute = () => {
    if (newAttribute !== "") {
      let sumOfAttributes = numOfAttributes + 1;
      setNumOfAttributes(sumOfAttributes);
      let object = {
        id: sumOfAttributes,
        name: newAttribute,
      };
      setAttributes([...attributes, object]);
    } else {
      alert("Please, type the attribute name to create a new attribute!");
    }
    setNewAttribute("");
    console.table(attributes);
  };

  const deleteAttribute = (id) => {
    if (attributes.length >= 1) {
      const newAttributes = attributes.filter(
        (attribute) => attribute.id !== id
      );
      setAttributes(newAttributes);
    }
  };

  function validateRelationship() {
    if (newRelationship === "") {
      alert("Please type a valid entity to create a new relationship!");
      return false;
    }

    const { acceptableEntities } = selectedObject;
    const str = newRelationship.split(":");
    const entityType = str[0];

    for (let i = 0; i < acceptableEntities.length; i++) {
      const acceptableEntity = acceptableEntities[i];
      console.log(acceptableEntity);
      console.log("relationships: ", relationships);
      if (entityType === acceptableEntity[0]) {
        if (acceptableEntity[1] === -1) {
          const sumOfEntities = entities.filter((entity) => {
            if (
              entity.type === type &&
              `ref${entityType}` in entity &&
              entity[`ref${entityType}`].value ===
                `urn:ngsi-ld:${newRelationship}`
            ) {
              console.log(entity);
              return entity;
            }
          });
          console.log("***********");
          console.log(sumOfEntities);
          if (sumOfEntities.length > 0) {
            alert("The entity specified is already related to another entity");
            return false;
          }
          return true;
        } else {
          const sumOfTypes = relationships.map(
            (relationship) => relationship.type === entityType
          );
          if (sumOfTypes.length === 0) {
            return true;
          } else {
            alert("you have already added the maximum limit for that entity");
            return false;
          }
        }
      }
    }

    alert(
      "Sorry, but this entity can´t create a relationship with the specified type!"
    );
    return false;
  }

  const addNewRelationship = () => {
    let canRelate = validateRelationship();
    if (canRelate) {
      const entitiesId = entities.map((entity) => entity.id);
      const indexId = entitiesId.indexOf(`urn:ngsi-ld:${newRelationship}`);
      if (indexId !== -1) {
        let object = entities[indexId];
        const newEntities = entities.filter(
          (entity) => entity.id !== entities[indexId].id
        );
        setEntities(newEntities);
        console.log(object);
        setRelationships([...relationships, object]);
        setNewRelationship("");
        console.log(entities);
      } else {
        alert("The entity id specified does not exist!");
      }
    }
  };

  const deleteRelationship = (id) => {
    const removedEntity = relationships.find(
      (relationship) => relationship.id === id
    );
    const newRelationships = relationships.filter(
      (relationship) => relationship.id !== id
    );
    setRelationships(newRelationships);
    setEntities([...entities, removedEntity]);
    console.log(entities);
  };

  function handleObjectChange(selectedOption) {
    setSelectedObject(selectedOption);
    setType(selectedOption.value);
    reset();
    console.log(selectedOption);
  }

  const customSelectObjectStyles = {
    control: (base) => ({
      ...base,
      marginTop: 5,
      height: 25,
      fontSize: 14,
      minHeight: 35,
      borderRadius: 2,
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 2,
      hyphens: "auto",
      marginTop: 0,
      textAlign: "left",
      wordWrap: "break-word",
    }),
    menuList: (base) => ({
      ...base,
      padding: 0,
      opacity: 1,
    }),
  };

  return (
    <>
      <Header create={"current"} />
      <main>
        <div className="header-block">
          <p className="title">Entity Form</p>
        </div>
        <div className="form-block">
          <div className="select-box">
            <label htmlFor="object-type">Select the Object Type: </label>
            <ReactSelect
              name="name"
              id="object-type"
              value={selectedObject}
              onChange={handleObjectChange}
              options={objectTypes}
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary25: "#15b097",
                  primary: "#333",
                },
              })}
              styles={customSelectObjectStyles}
            />
          </div>

          <Form onSubmit={handleSubmit}>
            <Input
              name="id"
              value={`urn:ngsi-ld:${type}:`}
              field="id"
              onChange={() => {}}
              invisible={true}
            />

            <Input
              value={type}
              onChange={() => {}}
              field="type"
              name="type"
              invisible={true}
            />

            <div className="attributes-header-block">
              <Input
                form=""
                name="attributes"
                field="new attribute"
                type="text"
                value={newAttribute}
                onChange={(e) => setNewAttribute(e.target.value)}
                onKeyPress={(e) => {
                  if (e.which === 13) return addNewAttribute();
                }}
                required
              />

              <button
                className="btn-style btn-add"
                onClick={addNewAttribute}
                type="button"
              >
                Add New Attribute
              </button>
            </div>

            {attributes.map((attribute) => (
              <Scope key={attribute.id} path={attribute.name}>
                <div className="attributes-container">
                  <span className="attribute-title">{attribute.name}</span>

                  <div className="attributes-block">
                    <div className="select-box">
                      <label htmlFor="type">type: </label>
                      <Select
                        className="select"
                        name={`type`}
                        width={130}
                        defaultValue={{ value: "Text", label: "Text" }}
                        options={validTypes}
                        theme={(theme) => ({
                          ...theme,
                          colors: {
                            ...theme.colors,
                            primary25: "#15b097",
                            primary: "#333",
                          },
                        })}
                        required={true}
                      />
                    </div>

                    <div className="input-block">
                      <Input name="value" field="value" required />
                    </div>

                    <button
                      className="btn-trash attributes"
                      onClick={() => deleteAttribute(attribute.id)}
                      type="button"
                    >
                      <span>
                        <FiTrash2 size={20} color="#333" />
                      </span>
                    </button>
                  </div>
                </div>
              </Scope>
            ))}

            <div className="attributes-header-block">
              <Input
                form=""
                name="attributes"
                field="new relationship"
                type="text"
                value={newRelationship}
                onChange={(e) => setNewRelationship(e.target.value)}
                onKeyPress={(e) => {
                  if (e.which === 13) return addNewRelationship();
                }}
                required
              />

              <button
                className="btn-style btn-add"
                onClick={addNewRelationship}
                type="button"
              >
                Add New Relationship
              </button>
            </div>

            {relationships.map((relationship) => (
              <Scope key={relationship.id} path={`ref${relationship.type}`}>
                <div className="attributes-container">
                  <span className="attribute-title">{`ref${relationship.type}`}</span>

                  <div className="attributes-block relate">
                    <div className="relationship-block">
                      <span>value: </span>

                      <div className="relationship-box">
                        <div className="relationship-value">
                          <Input
                            name="type"
                            value="Relationship"
                            onChange={() => {}}
                            invisible={true}
                          />
                          <Input
                            name="value"
                            value={relationship.id}
                            onChange={() => {}}
                            invisible={true}
                          />
                          <span>
                            <b>Id:</b> {relationship.id}
                          </span>
                        </div>

                        <button
                          className="btn-trash relate"
                          onClick={() => deleteRelationship(relationship.id)}
                          type="button"
                        >
                          <span>
                            <FiTrash2 size={20} color="#333" />
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* <button
                      className="button style-btn relate-btn"
                      onClick={() => deleteRelationship(relationship.id)}
                      type="button"
                    >
                      <div className="translate"></div>
                      <span className="trash-icon">
                        <DeleteIcon />
                      </span>
                    </button> */}
                  </div>
                </div>
              </Scope>
            ))}

            <div className="submit-block">
              <button className="btn-style btn-submit" type="submit">
                Create Entity
              </button>
            </div>
          </Form>
        </div>
      </main>
      <Footer />
    </>
  );
}