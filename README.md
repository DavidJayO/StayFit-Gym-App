# StayFit Gym

StayFit is an Expo SDK 57 mobile app using Supabase for authentication and its Postgres database.

## Connect a Supabase project

1. Create a project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the project's Connect panel. The publishable key is intended for client apps; never put a `service_role` or secret key in the app.
3. In the Supabase SQL Editor, run [`supabase/migrations/20261013000000_stayfit_backend.sql`](supabase/migrations/20261013000000_stayfit_backend.sql).
4. Run [`supabase/migrations/20261014000000_member_features.sql`](supabase/migrations/20261014000000_member_features.sql) after the first migration to enable member notifications, renewal requests, saved payment preference, and capacity-safe bookings.
5. Add real future classes to `public.gym_classes` and assign memberships in `public.memberships` for users who should have a plan. Member screens show empty states until these records exist.
6. In Supabase Auth settings, configure the site's email confirmation and password reset redirect URLs for your app's `stayfitgym://` scheme as needed.
7. Start Expo with `npx expo start`. Restart Expo after changing `.env` values.

Registration creates an Auth user and the database trigger creates its `profiles` row. If email confirmation is enabled, the user must verify their address before logging in. New users receive the `member` role. To authorize a gym administrator, register the account, then run this in the SQL Editor using that account's Auth user UUID:

```sql
update public.profiles set role = 'admin' where id = 'AUTH_USER_UUID';
```

The migrations create member profile, membership, class, booking, attendance, freeze request, daily pass request, payment, renewal request, preference, and notification tables. Row Level Security limits member records to their owner and gives administrator access only to profiles promoted by a trusted operator. Member booking, freeze, daily-pass, and renewal actions submit requests for staff review. Payments are read from the gym-managed ledger; the app does not process card/GCash transactions or issue scannable QR entry passes. The mobile app uses the Supabase Auth session and does not contain an administrator password or privileged key.

## Run the app

```bash
npm install
npx expo start
```

## Build an installable Android APK

The `preview` profile in [`eas.json`](eas.json) creates an APK for direct installation (not a Play Store bundle).

1. Sign in to EAS and link this app to an Expo project:

   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest build:configure
   ```

2. In the linked project's Expo dashboard, add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` as environment variables for the `preview` environment. These are needed because the cloud builder does not use this computer's local `.env` file.
3. Start the APK build:

   ```bash
   npx eas-cli@latest build --platform android --profile preview
   ```

4. When the build finishes, download its APK from the link shown by EAS. Copy it to an Android phone or tablet and open it to install. Android may ask you to allow installs from the browser or file manager.

The APK launches without Expo Go or a running development server. Sign-in, Supabase data, and other online features still need an internet connection. For weak school Wi-Fi, download the APK once using a stronger connection, then transfer it by USB or local file sharing.
