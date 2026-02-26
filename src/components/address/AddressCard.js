import React from "react";
import PropTypes from "prop-types";

const AddressCard = ({ address, onEdit, onDelete, strings }) => {
  return (
    <div className="address-card">
      <div className="address-content">
        <p><strong>{address.firstName} {address.lastName}</strong></p>
        {address.company && <p>{address.company}</p>}
        <p>{address.address}</p>
        <p>{address.city}, {address.zone || address.stateProvince}</p>
        <p>{address.country} - {address.postalCode}</p>
        <p>{strings["Phone"]}: {address.phone}</p>
      </div>
      <div className="address-actions">
        <button 
          type="button" 
          className="btn-edit" 
          onClick={() => onEdit(address)}
          title={strings["Edit"]}
        >
          <i className="pe-7s-pen"></i>
        </button>
        <button 
          type="button" 
          className="btn-delete" 
          onClick={() => onDelete(address.id)}
          title={strings["Delete"]}
        >
          <i className="pe-7s-trash"></i>
        </button>
      </div>
    </div>
  );
};

AddressCard.propTypes = {
  address: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  strings: PropTypes.object.isRequired
};

export default AddressCard;
