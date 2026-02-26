import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useToasts } from "react-toast-notifications";
import Card from "react-bootstrap/Card";
import Accordion from "react-bootstrap/Accordion";
import AddressList from "../../components/address/AddressList";
import { getAddresses, createAddress, updateAddress, deleteAddress } from "../../redux/actions/addressActions";
import { getState, getCountry } from "../../redux/actions/userAction";
import { multilanguage } from "redux-multilanguage";

const AddressManagement = ({ 
  addresses, 
  getAddresses, 
  createAddress, 
  updateAddress, 
  deleteAddress,
  strings,
  countryData,
  stateData,
  getState,
  getCountry,
  language
}) => {
  const { addToast } = useToasts();

  useEffect(() => {
    getAddresses();
    getCountry(language);
  }, [getAddresses, getCountry, language]);

  const handleAddAddress = async (addressData) => {
    try {
      await createAddress(addressData, addToast);
      await getAddresses();
    } catch (error) {
      console.error('Error adding address:', error);
    }
  };

  const handleUpdateAddress = async (id, addressData) => {
    try {
      await updateAddress(id, addressData, addToast);
      await getAddresses();
    } catch (error) {
      console.error('Error updating address:', error);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await deleteAddress(id, addToast);
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  return (
    <Card className="single-my-account mb-20">
      <Card.Header className="panel-heading">
        <Accordion.Toggle variant="link" eventKey="5">
          <h3 className="panel-title">
            <span>6 .</span> {strings["Addresses"]}
          </h3>
        </Accordion.Toggle>
      </Card.Header>
      <Accordion.Collapse eventKey="5">
        <Card.Body>
          <div className="myaccount-info-wrapper">
            <AddressList
              addresses={addresses}
              addressType="BILLING"
              onAdd={handleAddAddress}
              onUpdate={handleUpdateAddress}
              onDelete={handleDeleteAddress}
              strings={strings}
              countryData={countryData}
              stateData={stateData}
              getState={getState}
            />
            <AddressList
              addresses={addresses}
              addressType="DELIVERY"
              onAdd={handleAddAddress}
              onUpdate={handleUpdateAddress}
              onDelete={handleDeleteAddress}
              strings={strings}
              countryData={countryData}
              stateData={stateData}
              getState={getState}
            />
          </div>
        </Card.Body>
      </Accordion.Collapse>
    </Card>
  );
};

AddressManagement.propTypes = {
  addresses: PropTypes.array.isRequired,
  getAddresses: PropTypes.func.isRequired,
  createAddress: PropTypes.func.isRequired,
  updateAddress: PropTypes.func.isRequired,
  deleteAddress: PropTypes.func.isRequired,
  strings: PropTypes.object.isRequired,
  countryData: PropTypes.array.isRequired,
  stateData: PropTypes.array.isRequired,
  getState: PropTypes.func.isRequired,
  getCountry: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired
};

const mapStateToProps = (state) => {
  return {
    addresses: state.addressData.addresses,
    countryData: state.userData.country,
    stateData: state.userData.state,
    language: state.multilanguage.currentLanguageCode
  };
};

const mapDispatchToProps = dispatch => {
  return {
    getAddresses: () => dispatch(getAddresses()),
    createAddress: (data, toast) => dispatch(createAddress(data, toast)),
    updateAddress: (id, data, toast) => dispatch(updateAddress(id, data, toast)),
    deleteAddress: (id, toast) => dispatch(deleteAddress(id, toast)),
    getState: (code) => dispatch(getState(code)),
    getCountry: (language) => dispatch(getCountry(language))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(multilanguage(AddressManagement));
