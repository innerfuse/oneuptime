import OneUptimeDate from "Common/Types/Date";
import Timezone from "Common/Types/Timezone";
import User from "CommonUI/src/Utils/User";
import React, { FunctionComponent, ReactElement } from "react";
import { ShowToastNotification } from "CommonUI/src/Components/Toast/ToastInit";
import API from "CommonUI/src/Utils/API/API";
import { ToastType } from "CommonUI/src/Components/Toast/Toast";
import ConfirmModal from "CommonUI/src/Components/Modal/ConfirmModal";
import ModelAPI from "CommonUI/src/Utils/ModelAPI/ModelAPI";
import UserModel from "Model/Models/User";
import useAsyncEffect from "use-async-effect";

const UseTimezoneInitElement: FunctionComponent = (): ReactElement => {
  const [showConfirmModal, setShowConfirmModal] =
    React.useState<boolean>(false);
  const [timezoneToSave, setTimezoneToSave] = React.useState<Timezone | null>(
    null,
  );

  type UpdateUserTimezoneFunction = (timezone: Timezone) => Promise<void>;

  const updateUserTimezone: UpdateUserTimezoneFunction = async (
    timezone: Timezone,
  ): Promise<void> => {
    try {
      User.setSavedUserTimezone(timezone);

      await ModelAPI.updateById({
        id: User.getUserId(),
        data: {
          timezone: timezone,
        },
        modelType: UserModel,
      });
    } catch (err) {
      ShowToastNotification({
        title: "Error Saving Timezone",
        description: API.getFriendlyErrorMessage(err as Error),
        type: ToastType.DANGER,
      });
    }
  };

  useAsyncEffect(async () => {
    if (User.isLoggedIn()) {
      // check user timezone

      const guessTimezone: Timezone = OneUptimeDate.getCurrentTimezone();

      if (
        User.getSavedUserTimezone() === null ||
        User.getSavedUserTimezone() !== guessTimezone
      ) {
        if (User.getSavedUserTimezone() !== null) {
          // show confirm dialog to the usert to update the timezone
          setShowConfirmModal(true);
          setTimezoneToSave(guessTimezone);
        } else {
          // update user timezone to the server and save it to the local storage as well.
          await updateUserTimezone(guessTimezone);
        }
      }
    }
  }, []);

  if (showConfirmModal) {
    return (
      <ConfirmModal
        title={`Update Timezone`}
        description={
          <div>
            <p>
              We have detected that your timezone is different from the timezone
              you have saved in your profile. Would you like to update your
              timezone to <strong>{timezoneToSave?.toString()}</strong>?
            </p>
          </div>
        }
        onClose={() => {
          setShowConfirmModal(false);
        }}
        submitButtonText={"Save"}
        onSubmit={async () => {
          setShowConfirmModal(false);
          return await updateUserTimezone(timezoneToSave as Timezone);
        }}
      />
    );
  }

  return <></>;
};

export default UseTimezoneInitElement;
