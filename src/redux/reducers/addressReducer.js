import { SET_ADDRESSES, ADD_ADDRESS, UPDATE_ADDRESS, DELETE_ADDRESS } from "../actions/addressActions";

const initState = {
  addresses: []
};

const addressReducer = (state = initState, action) => {
  if (action.type === SET_ADDRESSES) {
    return {
      ...state,
      addresses: action.payload || []
    };
  }

  if (action.type === ADD_ADDRESS) {
    return {
      ...state,
      addresses: [...state.addresses, action.payload]
    };
  }

  if (action.type === UPDATE_ADDRESS) {
    return {
      ...state,
      addresses: state.addresses.map(addr => 
        addr.id === action.payload.id ? action.payload : addr
      )
    };
  }

  if (action.type === DELETE_ADDRESS) {
    return {
      ...state,
      addresses: state.addresses.filter(addr => addr.id !== action.payload)
    };
  }

  return state;
};

export default addressReducer;
