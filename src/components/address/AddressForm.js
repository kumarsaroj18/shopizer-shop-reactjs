import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useForm, Controller } from "react-hook-form";

const addressFormFields = {
  firstName: {
    name: "firstName",
    validate: {
      required: { value: true, message: "First name is required" }
    }
  },
  lastName: {
    name: "lastName",
    validate: {
      required: { value: true, message: "Last name is required" }
    }
  },
  company: {
    name: "company"
  },
  address: {
    name: "address",
    validate: {
      required: { value: true, message: "Address is required" }
    }
  },
  city: {
    name: "city",
    validate: {
      required: { value: true, message: "City is required" }
    }
  },
  country: {
    name: "country",
    validate: {
      required: { value: true, message: "Country is required" }
    }
  },
  stateProvince: {
    name: "stateProvince",
    validate: {
      required: { value: true, message: "State is required" }
    }
  },
  postalCode: {
    name: "postalCode",
    validate: {
      required: { value: true, message: "Postal code is required" }
    }
  },
  phone: {
    name: "phone",
    validate: {
      required: { value: true, message: "Phone is required" },
      minLength: { value: 10, message: "Enter a 10-digit number" }
    }
  }
};

const AddressForm = ({ 
  address, 
  addressType, 
  onSubmit, 
  onCancel, 
  strings,
  countryData,
  stateData,
  getState
}) => {
  const { register, handleSubmit, errors, control, setValue } = useForm({
    mode: "onChange"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (address) {
      setValue('firstName', address.firstName);
      setValue('lastName', address.lastName);
      setValue('company', address.company);
      setValue('address', address.address);
      setValue('city', address.city);
      setValue('country', address.country);
      setValue('postalCode', address.postalCode);
      setValue('phone', address.phone);
      if (address.country) {
        getState(address.country);
      }
      setTimeout(() => {
        setValue('stateProvince', address.zone || address.stateProvince);
      }, 500);
    }
  }, [address, setValue, getState]);

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const addressData = {
        ...data,
        zone: data.stateProvince,
        billingAddress: addressType === 'BILLING'
      };
      await onSubmit(addressData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCountryChange = (value) => {
    setValue('country', value);
    setValue('stateProvince', '');
    getState(value);
  };

  return (
    <div className="address-form-modal">
      <div className="address-form-overlay" onClick={onCancel}></div>
      <div className="address-form-container">
        <div className="address-form-header">
          <h4>{address ? strings["Edit Address"] : strings["Add New Address"]}</h4>
          <button type="button" className="close-btn" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="row">
            <div className="col-lg-6 col-md-6">
              <div className="billing-info">
                <label>{strings["First Name"]}</label>
                <input 
                  type="text" 
                  name={addressFormFields.firstName.name} 
                  ref={register(addressFormFields.firstName.validate)} 
                />
                {errors[addressFormFields.firstName.name] && (
                  <p className="error-msg">{errors[addressFormFields.firstName.name].message}</p>
                )}
              </div>
            </div>
            <div className="col-lg-6 col-md-6">
              <div className="billing-info">
                <label>{strings["Last Name"]}</label>
                <input 
                  type="text" 
                  name={addressFormFields.lastName.name} 
                  ref={register(addressFormFields.lastName.validate)} 
                />
                {errors[addressFormFields.lastName.name] && (
                  <p className="error-msg">{errors[addressFormFields.lastName.name].message}</p>
                )}
              </div>
            </div>
            <div className="col-lg-12">
              <div className="billing-info">
                <label>{strings["Company Name"]}</label>
                <input 
                  type="text" 
                  name={addressFormFields.company.name} 
                  ref={register(addressFormFields.company.validate)} 
                />
              </div>
            </div>
            <div className="col-lg-12">
              <div className="billing-info">
                <label>{strings["Street Address"]}</label>
                <input 
                  type="text" 
                  name={addressFormFields.address.name} 
                  ref={register(addressFormFields.address.validate)} 
                  placeholder={strings["House number and street name"]}
                />
                {errors[addressFormFields.address.name] && (
                  <p className="error-msg">{errors[addressFormFields.address.name].message}</p>
                )}
              </div>
            </div>
            <div className="col-lg-6 col-md-6">
              <div className="billing-info">
                <label>{strings["Country"]}</label>
                <Controller
                  name={addressFormFields.country.name}
                  control={control}
                  rules={addressFormFields.country.validate}
                  render={props => (
                    <select 
                      onChange={(e) => { 
                        props.onChange(e.target.value); 
                        handleCountryChange(e.target.value); 
                      }} 
                      value={props.value || ''}
                    >
                      <option value="">{strings["Select a country"]}</option>
                      {countryData.map((data, i) => (
                        <option key={i} value={data.code}>{data.name}</option>
                      ))}
                    </select>
                  )}
                />
                {errors[addressFormFields.country.name] && (
                  <p className="error-msg">{errors[addressFormFields.country.name].message}</p>
                )}
              </div>
            </div>
            <div className="col-lg-6 col-md-6">
              <div className="billing-info">
                <label>{strings["State"]}</label>
                {stateData && stateData.length > 0 ? (
                  <Controller
                    name={addressFormFields.stateProvince.name}
                    control={control}
                    rules={addressFormFields.stateProvince.validate}
                    render={props => (
                      <select 
                        onChange={(e) => props.onChange(e.target.value)} 
                        value={props.value || ''}
                      >
                        <option value="">{strings["Select a state"]}</option>
                        {stateData.map((data, i) => (
                          <option key={i} value={data.code}>{data.name}</option>
                        ))}
                      </select>
                    )}
                  />
                ) : (
                  <input 
                    type="text" 
                    name={addressFormFields.stateProvince.name} 
                    ref={register(addressFormFields.stateProvince.validate)} 
                  />
                )}
                {errors[addressFormFields.stateProvince.name] && (
                  <p className="error-msg">{errors[addressFormFields.stateProvince.name].message}</p>
                )}
              </div>
            </div>
            <div className="col-lg-6 col-md-6">
              <div className="billing-info">
                <label>{strings["Town/City"]}</label>
                <input 
                  type="text" 
                  name={addressFormFields.city.name} 
                  ref={register(addressFormFields.city.validate)} 
                />
                {errors[addressFormFields.city.name] && (
                  <p className="error-msg">{errors[addressFormFields.city.name].message}</p>
                )}
              </div>
            </div>
            <div className="col-lg-6 col-md-6">
              <div className="billing-info">
                <label>{strings["Postcode"]}</label>
                <input 
                  type="text" 
                  name={addressFormFields.postalCode.name} 
                  ref={register(addressFormFields.postalCode.validate)} 
                />
                {errors[addressFormFields.postalCode.name] && (
                  <p className="error-msg">{errors[addressFormFields.postalCode.name].message}</p>
                )}
              </div>
            </div>
            <div className="col-lg-12">
              <div className="billing-info">
                <label>{strings["Phone"]}</label>
                <input 
                  type="tel" 
                  name={addressFormFields.phone.name} 
                  ref={register(addressFormFields.phone.validate)} 
                />
                {errors[addressFormFields.phone.name] && (
                  <p className="error-msg">{errors[addressFormFields.phone.name].message}</p>
                )}
              </div>
            </div>
          </div>
          <div className="address-form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel} disabled={isSubmitting}>
              {strings["Cancel"]}
            </button>
            <button type="submit" className="btn-save" disabled={isSubmitting}>
              {isSubmitting ? strings["Saving..."] : strings["Save Address"]}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AddressForm.propTypes = {
  address: PropTypes.object,
  addressType: PropTypes.oneOf(['BILLING', 'DELIVERY']).isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  strings: PropTypes.object.isRequired,
  countryData: PropTypes.array.isRequired,
  stateData: PropTypes.array.isRequired,
  getState: PropTypes.func.isRequired
};

export default AddressForm;
