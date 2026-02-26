import WebService from '../../util/webService';
import constant from '../../util/constant';
import { setLoader } from "./loaderActions";

export const SET_ADDRESSES = "SET_ADDRESSES";
export const ADD_ADDRESS = "ADD_ADDRESS";
export const UPDATE_ADDRESS = "UPDATE_ADDRESS";
export const DELETE_ADDRESS = "DELETE_ADDRESS";

export const getAddresses = () => {
  return async dispatch => {
    try {
      let action = constant.ACTION.AUTH + constant.ACTION.CUSTOMER + constant.ACTION.PROFILE;
      let response = await WebService.get(action);
      
      // Convert old format to new format
      const addresses = [];
      if (response.billing) {
        addresses.push({
          id: 'billing',
          ...response.billing,
          billingAddress: true
        });
      }
      if (response.delivery) {
        addresses.push({
          id: 'delivery',
          ...response.delivery,
          billingAddress: false
        });
      }
      
      dispatch({
        type: SET_ADDRESSES,
        payload: addresses
      });
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };
};

export const createAddress = (addressData, addToast) => {
  return async (dispatch, getState) => {
    dispatch(setLoader(true));
    try {
      const { userData } = getState().userData;
      let action = constant.ACTION.AUTH + constant.ACTION.CUSTOMER + constant.ACTION.ADDRESS;
      
      const isBilling = addressData.billingAddress;
      const param = {
        id: userData.id,
        [isBilling ? 'billing' : 'delivery']: {
          company: addressData.company || '',
          address: addressData.address,
          city: addressData.city,
          postalCode: addressData.postalCode,
          stateProvince: addressData.stateProvince,
          country: addressData.country,
          zone: addressData.zone || addressData.stateProvince,
          firstName: addressData.firstName,
          lastName: addressData.lastName,
          phone: addressData.phone
        }
      };
      
      await WebService.patch(action, param);
      dispatch(setLoader(false));
      if (addToast) {
        addToast(`${isBilling ? 'Billing' : 'Delivery'} address added successfully`, { appearance: "success", autoDismiss: true });
      }
      
      // Refresh addresses
      dispatch(getAddresses());
    } catch (error) {
      dispatch(setLoader(false));
      if (addToast) {
        addToast("Failed to add address", { appearance: "error", autoDismiss: true });
      }
      throw error;
    }
  };
};

export const updateAddress = (id, addressData, addToast) => {
  return async (dispatch, getState) => {
    dispatch(setLoader(true));
    try {
      const { userData } = getState().userData;
      let action = constant.ACTION.AUTH + constant.ACTION.CUSTOMER + constant.ACTION.ADDRESS;
      
      const isBilling = addressData.billingAddress;
      const param = {
        id: userData.id,
        [isBilling ? 'billing' : 'delivery']: {
          company: addressData.company || '',
          address: addressData.address,
          city: addressData.city,
          postalCode: addressData.postalCode,
          stateProvince: addressData.stateProvince,
          country: addressData.country,
          zone: addressData.zone || addressData.stateProvince,
          firstName: addressData.firstName,
          lastName: addressData.lastName,
          phone: addressData.phone
        }
      };
      
      await WebService.patch(action, param);
      dispatch(setLoader(false));
      if (addToast) {
        addToast(`${isBilling ? 'Billing' : 'Delivery'} address updated successfully`, { appearance: "success", autoDismiss: true });
      }
      
      // Refresh addresses
      dispatch(getAddresses());
    } catch (error) {
      dispatch(setLoader(false));
      if (addToast) {
        addToast("Failed to update address", { appearance: "error", autoDismiss: true });
      }
      throw error;
    }
  };
};

export const deleteAddress = (id, addToast) => {
  return async dispatch => {
    if (addToast) {
      addToast("Cannot delete address. Please update it instead.", { appearance: "warning", autoDismiss: true });
    }
  };
};
