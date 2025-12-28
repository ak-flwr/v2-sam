import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create default policy config
  await prisma.policyConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      reschedule_cutoff_minutes: 120,
      max_geo_move_meters: 250,
      trust_threshold_location: 0.8,
    },
  })

  // Create demo shipments in Riyadh
  const shipments = [
    {
      shipment_id: 'SHP-2025-001',
      status: 'OUT_FOR_DELIVERY',
      eta_ts: new Date(Date.now() + 3 * 60 * 60 * 1000), // ETA in 3 hours
      window_start: new Date(Date.now() + 2 * 60 * 60 * 1000),
      window_end: new Date(Date.now() + 4 * 60 * 60 * 1000),
      address_text: 'King Fahd Road, Al Olaya District, Riyadh',
      address_text_ar: 'طريق الملك فهد، حي العليا، الرياض',
      geo_lat: 24.7136,
      geo_lng: 46.6753,
      instructions: 'Call upon arrival',
      contact_phone_masked: '+966 5X XXX 1234',
      risk_tier: 'low',
    },
    {
      shipment_id: 'SHP-2025-002',
      status: 'OUT_FOR_DELIVERY',
      eta_ts: new Date(Date.now() + 5 * 60 * 60 * 1000), // ETA in 5 hours
      window_start: new Date(Date.now() + 4 * 60 * 60 * 1000),
      window_end: new Date(Date.now() + 6 * 60 * 60 * 1000),
      address_text: 'King Abdullah Road, Al Malqa District, Riyadh',
      address_text_ar: 'طريق الملك عبدالله، حي الملقا، الرياض',
      geo_lat: 24.7716,
      geo_lng: 46.6219,
      instructions: 'Leave at reception desk',
      contact_phone_masked: '+966 5X XXX 5678',
      risk_tier: 'medium',
    },
    {
      shipment_id: 'SHP-2025-003',
      status: 'OUT_FOR_DELIVERY',
      eta_ts: new Date(Date.now() + 2 * 60 * 60 * 1000), // ETA in 2 hours
      window_start: new Date(Date.now() + 1 * 60 * 60 * 1000),
      window_end: new Date(Date.now() + 3 * 60 * 60 * 1000),
      address_text: 'Prince Turki bin Abdulaziz Al Awwal Road, Hittin, Riyadh',
      address_text_ar: 'طريق الأمير تركي بن عبدالعزيز الأول، حي حطين، الرياض',
      geo_lat: 24.7744,
      geo_lng: 46.6361,
      instructions: 'Ring doorbell twice',
      contact_phone_masked: '+966 5X XXX 9012',
      risk_tier: 'low',
    },
    {
      shipment_id: 'SHP-2025-004',
      status: 'PENDING',
      eta_ts: new Date(Date.now() + 24 * 60 * 60 * 1000), // ETA tomorrow
      window_start: new Date(Date.now() + 23 * 60 * 60 * 1000),
      window_end: new Date(Date.now() + 26 * 60 * 60 * 1000),
      address_text: 'Olaya Street, Al Olaya, Riyadh',
      address_text_ar: 'شارع العليا، حي العليا، الرياض',
      geo_lat: 24.6969,
      geo_lng: 46.6855,
      instructions: 'Office building - 3rd floor',
      contact_phone_masked: '+966 5X XXX 3456',
      risk_tier: 'high',
    },
    {
      shipment_id: 'SHP-2025-005',
      status: 'OUT_FOR_DELIVERY',
      eta_ts: new Date(Date.now() + 4 * 60 * 60 * 1000), // ETA in 4 hours
      window_start: new Date(Date.now() + 3 * 60 * 60 * 1000),
      window_end: new Date(Date.now() + 5 * 60 * 60 * 1000),
      address_text: 'Takhassusi Street, Riyadh',
      address_text_ar: 'شارع التخصصي، الرياض',
      geo_lat: 24.7045,
      geo_lng: 46.6724,
      instructions: null,
      contact_phone_masked: '+966 5X XXX 7890',
      risk_tier: 'low',
    },
  ]

  for (const shipment of shipments) {
    await prisma.shipment.upsert({
      where: { shipment_id: shipment.shipment_id },
      update: shipment,
      create: shipment,
    })
    console.log(`✅ Created shipment: ${shipment.shipment_id}`)
  }

  console.log('🎉 Seeding complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
