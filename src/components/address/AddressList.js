import React, { useState } from "react";
import PropTypes from "prop-types";
import AddressCard from "./AddressCard";
import AddressForm from "./AddressForm";
import SweetAlert from 'react-bootstrap-sweetalert';

const AddressList = ({ 
  addresses, 
  addressType, 
  onAdd, 
  onUpdate, 
  onDelete, 
  strings,
  countryData,
  stateData,
  getState
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const filteredAddresses = addresses.filter(addr => addr.billingAddress === (addressType === 'BILLING'));

  const handleEdit = (address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingAddress(null);
    setShowForm(true);
  };

  const handleFormSubmit = async (data) => {
    if (editingAddress) {
      await onUpdate(editingAddress.id, data);
    } else {
      await onAdd(data);
    }
    setShowForm(false);
    setEditingAddress(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAddress(null);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    await onDelete(deleteId);
    setDeleteId(null);
  };

  const handleDeleteCancel = () => {
    setDeleteId(null);
  };

  return (
    <div className="address-list-section">
      <div className="address-list-header">
        <h4>{addressType === 'BILLING' ? strings["Billing Addresses"] : strings["Delivery Addresses"]}</h4>
        <button type="button" className="btn-add-address" onClick={handleAdd}>
          + {strings["Add New Address"]}
        </button>
      </div>

      {filteredAddresses.length === 0 && !showForm && (
        <p className="no-addresses">{strings["No addresses found"]}</p>
      )}

      <div className="address-grid">
        {filteredAddresses.map(address => (
          <AddressCard
            key={address.id}
            address={address}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            strings={strings}
          />
        ))}
      </div>

      {showForm && (
        <AddressForm
          address={editingAddress}
          addressType={addressType}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          strings={strings}
          countryData={countryData}
          stateData={stateData}
          getState={getState}
        />
      )}

      {deleteId && (
        <SweetAlert
          showCancel
          cancelBtnBsStyle="light"
          confirmBtnText={strings["Yes, delete it!"]}
          confirmBtnBsStyle="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          title={strings["Are you sure?"]}
        >
          {strings["Are you sure you want to delete this address?"]}
        </SweetAlert>
      )}
    </div>
  );
};

AddressList.propTypes = {
  addresses: PropTypes.array.isRequired,
  addressType: PropTypes.oneOf(['BILLING', 'DELIVERY']).isRequired,
  onAdd: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  strings: PropTypes.object.isRequired,
  countryData: PropTypes.array.isRequired,
  stateData: PropTypes.array.isRequired,
  getState: PropTypes.func.isRequired
};

export default AddressList;
